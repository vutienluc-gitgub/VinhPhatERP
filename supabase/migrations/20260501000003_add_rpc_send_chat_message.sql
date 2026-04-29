-- ==========================================
-- Migration: Add RPC for sending chat messages
-- ==========================================
-- Bug fix: sendChatMessage was using client-side upsert which:
-- 1. Does not set tenant_id (NOT NULL column) — causes insert failure
-- 2. Does not set sender_id — messages have no author
-- 3. Requires client to know tenant_id (leaks internal detail)
--
-- Fix: Server-side RPC that auto-injects tenant_id and sender_id from JWT.
-- Uses ON CONFLICT (client_id) DO NOTHING for idempotent sends.

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
  -- Get tenant_id from JWT
  v_tenant_id := (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::UUID;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Missing tenant_id in JWT';
  END IF;

  -- Get current user
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

  -- Idempotent insert (ON CONFLICT client_id → skip)
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

  -- If duplicate (already sent), fetch existing
  IF v_message_id IS NULL THEN
    SELECT id INTO v_message_id FROM public.chat_messages
    WHERE client_id = p_client_id;
  END IF;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.rpc_send_chat_message TO authenticated;
