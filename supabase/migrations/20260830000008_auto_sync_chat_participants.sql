-- ============================================================
-- Migration: Comprehensive Chat Room Participant Synchronization
-- Description:
-- 1. Auto-adds all relevant parties (Customer / Supplier / Driver / Internal Staff) to chat_room_participants
-- 2. Syncs participants on room creation, message sending, and profile linking
-- 3. Backfills participants for all existing chat rooms
-- ============================================================

-- ── 1. Helper function to ensure all participants are in a room ──
CREATE OR REPLACE FUNCTION public.fn_sync_room_participants(p_room_id UUID)
RETURNS VOID AS $$
DECLARE
  v_room RECORD;
BEGIN
  SELECT id, tenant_id, entity_type, entity_id
  INTO v_room
  FROM public.chat_rooms
  WHERE id = p_room_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- 1. Add all active internal staff of the tenant (valid auth users only)
  INSERT INTO public.chat_room_participants (room_id, user_id, role)
  SELECT v_room.id, p.id, 'admin'
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE (p.tenant_id = v_room.tenant_id OR p.tenant_id IS NULL)
    AND p.role::text IN ('admin', 'manager', 'staff', 'kho', 'warehouse', 'sale', 'operator', 'accountant', 'supervisor')
    AND p.is_active = true
  ON CONFLICT (room_id, user_id) DO NOTHING;

  -- 2. Add customer portal users
  IF v_room.entity_type = 'customer' THEN
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    SELECT v_room.id, p.id, 'customer'
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.customer_id = v_room.entity_id::UUID
      AND p.is_active = true
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;

  -- 3. Add supplier portal users
  IF v_room.entity_type = 'supplier' THEN
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    SELECT v_room.id, p.id, 'supplier'
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.supplier_id = v_room.entity_id::UUID
      AND p.is_active = true
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;

  -- 4. Add shipment driver and customer
  IF v_room.entity_type = 'shipment' THEN
    -- Delivery staff / Driver
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    SELECT v_room.id, s.delivery_staff_id, 'driver'
    FROM public.shipments s
    JOIN auth.users u ON s.delivery_staff_id = u.id
    WHERE s.id = v_room.entity_id::UUID
      AND s.delivery_staff_id IS NOT NULL
    ON CONFLICT (room_id, user_id) DO NOTHING;

    -- Customer for this shipment
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    SELECT v_room.id, p.id, 'customer'
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    JOIN public.shipments s ON p.customer_id = s.customer_id
    WHERE s.id = v_room.entity_id::UUID
      AND p.is_active = true
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. Trigger on chat_rooms: sync participants when a room is created ──
CREATE OR REPLACE FUNCTION public.trg_fn_sync_chat_room_participants()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.fn_sync_room_participants(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_chat_room_participants ON public.chat_rooms;
CREATE TRIGGER trg_sync_chat_room_participants
  AFTER INSERT ON public.chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_sync_chat_room_participants();

-- ── 3. Trigger on profiles: sync participants when user customer_id/supplier_id is linked ──
CREATE OR REPLACE FUNCTION public.trg_fn_sync_profile_to_chat_rooms()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL AND (OLD.customer_id IS NULL OR OLD.customer_id != NEW.customer_id) THEN
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    SELECT r.id, NEW.id, 'customer'
    FROM public.chat_rooms r
    JOIN auth.users u ON NEW.id = u.id
    WHERE r.entity_type = 'customer'
      AND r.entity_id = NEW.customer_id::TEXT
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;

  IF NEW.supplier_id IS NOT NULL AND (OLD.supplier_id IS NULL OR OLD.supplier_id != NEW.supplier_id) THEN
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    SELECT r.id, NEW.id, 'supplier'
    FROM public.chat_rooms r
    JOIN auth.users u ON NEW.id = u.id
    WHERE r.entity_type = 'supplier'
      AND r.entity_id = NEW.supplier_id::TEXT
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_profile_to_chat_rooms ON public.profiles;
CREATE TRIGGER trg_sync_profile_to_chat_rooms
  AFTER INSERT OR UPDATE OF customer_id, supplier_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_sync_profile_to_chat_rooms();

-- ── 4. Update rpc_get_or_create_chat_room to always sync participants ──
CREATE OR REPLACE FUNCTION public.rpc_get_or_create_chat_room(
  p_entity_type TEXT,
  p_entity_id UUID
) RETURNS UUID AS $$
DECLARE
  v_room_id UUID;
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  v_tenant_id := public.current_tenant_id();

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Cannot resolve tenant for current user';
  END IF;

  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Missing user authentication';
  END IF;

  -- Upsert room (idempotent)
  INSERT INTO public.chat_rooms (tenant_id, entity_type, entity_id, status)
  VALUES (v_tenant_id, p_entity_type, p_entity_id::TEXT, 'active')
  ON CONFLICT (tenant_id, entity_type, entity_id) DO NOTHING
  RETURNING id INTO v_room_id;

  -- If room already existed, fetch its ID
  IF v_room_id IS NULL THEN
    SELECT id INTO v_room_id FROM public.chat_rooms
    WHERE tenant_id = v_tenant_id
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id::TEXT;
  END IF;

  -- Synchronize all room participants (caller + target entity users + staff)
  PERFORM public.fn_sync_room_participants(v_room_id);

  -- Ensure caller is a member
  INSERT INTO public.chat_room_participants (room_id, user_id, role)
  VALUES (v_room_id, v_user_id, 'member')
  ON CONFLICT (room_id, user_id) DO NOTHING;

  RETURN v_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. Update rpc_send_chat_message to sync participants and insert message ──
CREATE OR REPLACE FUNCTION public.rpc_send_chat_message(
  p_client_id UUID,
  p_room_id UUID,
  p_content TEXT,
  p_message_type VARCHAR DEFAULT 'text',
  p_image_url TEXT DEFAULT NULL,
  p_mentions JSONB DEFAULT '[]'::jsonb,
  p_file_url TEXT DEFAULT NULL,
  p_file_name TEXT DEFAULT NULL,
  p_file_type VARCHAR DEFAULT NULL,
  p_reply_to_id UUID DEFAULT NULL,
  p_reply_to_message JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_message_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Missing user authentication';
  END IF;

  -- Resolve tenant from room if possible, fallback to user tenant
  SELECT tenant_id INTO v_tenant_id
  FROM public.chat_rooms
  WHERE id = p_room_id;

  IF v_tenant_id IS NULL THEN
    v_tenant_id := public.current_tenant_id();
  END IF;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Cannot resolve tenant for room %', p_room_id;
  END IF;

  -- Sync all participants before message insert
  PERFORM public.fn_sync_room_participants(p_room_id);

  -- Ensure caller is member
  INSERT INTO public.chat_room_participants (room_id, user_id, role)
  VALUES (p_room_id, v_user_id, 'member')
  ON CONFLICT (room_id, user_id) DO NOTHING;

  -- Idempotent insert
  INSERT INTO public.chat_messages (
    client_id, tenant_id, room_id, sender_id,
    message_type, content, image_url, file_url, file_name, file_type,
    reply_to_id, reply_to_message, status, mentions
  )
  VALUES (
    p_client_id, v_tenant_id, p_room_id, v_user_id,
    p_message_type, p_content, p_image_url, p_file_url, p_file_name, p_file_type,
    p_reply_to_id, p_reply_to_message, 'sent', COALESCE(p_mentions, '[]'::jsonb)
  )
  ON CONFLICT (client_id) DO NOTHING
  RETURNING id INTO v_message_id;

  IF v_message_id IS NULL THEN
    SELECT id INTO v_message_id FROM public.chat_messages
    WHERE client_id = p_client_id;
  END IF;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 6. Backfill all existing rooms ──
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.chat_rooms LOOP
    PERFORM public.fn_sync_room_participants(r.id);
  END LOOP;
END;
$$;
