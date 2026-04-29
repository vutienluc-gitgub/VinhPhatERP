-- ==========================================
-- Migration: Fix Chat tenant resolution
-- ==========================================
-- ROOT CAUSE: Chat RPC and RLS policies used:
--   (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::UUID
-- But tenant_id is NOT in the JWT. The ERP uses:
--   public.current_tenant_id()  (which does: SELECT tenant_id FROM profiles WHERE id = auth.uid())
--
-- This migration fixes ALL chat SQL to use the correct tenant resolution.

-- ── 1. Fix RPC: rpc_get_or_create_chat_room ──
CREATE OR REPLACE FUNCTION public.rpc_get_or_create_chat_room(
  p_entity_type TEXT,
  p_entity_id UUID
) RETURNS UUID AS $$
DECLARE
  v_room_id UUID;
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  -- Use the same tenant resolution as the rest of the ERP
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
  VALUES (v_tenant_id, p_entity_type, p_entity_id, 'active')
  ON CONFLICT (tenant_id, entity_type, entity_id) DO NOTHING
  RETURNING id INTO v_room_id;

  -- If room already existed, fetch its ID
  IF v_room_id IS NULL THEN
    SELECT id INTO v_room_id FROM public.chat_rooms
    WHERE tenant_id = v_tenant_id
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id;
  END IF;

  -- Add caller as participant (idempotent)
  INSERT INTO public.chat_room_participants (room_id, user_id, role)
  VALUES (v_room_id, v_user_id, 'member')
  ON CONFLICT (room_id, user_id) DO NOTHING;

  RETURN v_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. Fix RPC: rpc_send_chat_message ──
CREATE OR REPLACE FUNCTION public.rpc_send_chat_message(
  p_client_id UUID,
  p_room_id UUID,
  p_content TEXT,
  p_message_type VARCHAR DEFAULT 'text',
  p_image_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_message_id UUID;
BEGIN
  v_tenant_id := public.current_tenant_id();

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Cannot resolve tenant for current user';
  END IF;

  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Missing user authentication';
  END IF;

  -- Verify user is a participant of this room
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_room_participants
    WHERE room_id = p_room_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a participant of this room';
  END IF;

  -- Idempotent insert
  INSERT INTO public.chat_messages (
    client_id, tenant_id, room_id, sender_id,
    message_type, content, image_url, status
  )
  VALUES (
    p_client_id, v_tenant_id, p_room_id, v_user_id,
    p_message_type, p_content, p_image_url, 'sent'
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

-- ── 3. Fix RLS policies on chat_rooms ──
DROP POLICY IF EXISTS "Users can view rooms they are part of" ON public.chat_rooms;
CREATE POLICY "Users can view rooms they are part of" ON public.chat_rooms
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    AND id IN (SELECT room_id FROM public.chat_room_participants WHERE user_id = auth.uid())
  );

-- ── 4. Fix RLS policies on chat_messages ──
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
CREATE POLICY "Users can view messages in their rooms" ON public.chat_messages
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    AND room_id IN (SELECT room_id FROM public.chat_room_participants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert messages in their rooms" ON public.chat_messages;
CREATE POLICY "Users can insert messages in their rooms" ON public.chat_messages
  FOR INSERT WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND room_id IN (SELECT room_id FROM public.chat_room_participants WHERE user_id = auth.uid())
  );

-- ── 5. Grants ──
GRANT EXECUTE ON FUNCTION public.rpc_get_or_create_chat_room TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_send_chat_message TO authenticated;
