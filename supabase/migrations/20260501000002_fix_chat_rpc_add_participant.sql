-- ==========================================
-- Migration: Fix Chat RPC — Add caller as participant
-- ==========================================
-- Bug fix: rpc_get_or_create_chat_room creates the room but does NOT
-- add the calling user as a participant. This causes a RLS deadlock:
-- the user can never SELECT the room or its messages because RLS
-- policies on chat_rooms and chat_messages require the user to be
-- in chat_room_participants.
--
-- Fix: After creating/finding the room, INSERT the caller into
-- chat_room_participants with ON CONFLICT DO NOTHING (idempotent).

CREATE OR REPLACE FUNCTION public.rpc_get_or_create_chat_room(
  p_entity_type TEXT,
  p_entity_id UUID
) RETURNS UUID AS $$
DECLARE
  v_room_id UUID;
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current tenant_id from JWT
  v_tenant_id := (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::UUID;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Missing tenant_id in JWT';
  END IF;

  -- Get current user_id
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

  -- Add caller as participant (idempotent) — fixes RLS deadlock
  INSERT INTO public.chat_room_participants (room_id, user_id, role)
  VALUES (v_room_id, v_user_id, 'admin')
  ON CONFLICT (room_id, user_id) DO NOTHING;

  RETURN v_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
