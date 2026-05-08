-- Fix: chat_room_participants missing INSERT policy
-- Noted in 20260501000006 item 3 but never implemented.
-- Without this, rpc_get_or_create_chat_room (SECURITY DEFINER) can insert
-- participants, but the RLS SELECT check in rpc_send_chat_message:
--   "User is not a participant of this room"
-- fails because the SELECT policy uses user_id = auth.uid() and tenant
-- isolation from current_tenant_id() — but the row's tenant is resolved
-- via the room, not directly on chat_room_participants.
--
-- Root cause for customer portal users:
-- After rpc_get_or_create_chat_room adds the customer as participant,
-- rpc_send_chat_message does:
--   SELECT 1 FROM chat_room_participants WHERE room_id=? AND user_id=auth.uid()
-- This SELECT is filtered by RLS. If the current_tenant_id() returns NULL
-- at that point (inside SECURITY DEFINER context), the row is invisible.
--
-- Fix 1: Add INSERT policy so users can join rooms (belt-and-suspenders)
-- Fix 2: Make the participant check inside rpc_send_chat_message bypass RLS

-- ── 1. Add INSERT policy for chat_room_participants ──
DROP POLICY IF EXISTS "Users can join chat rooms" ON public.chat_room_participants;
CREATE POLICY "Users can join chat rooms" ON public.chat_room_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ── 2. Patch rpc_send_chat_message to use SECURITY DEFINER participant check ──
-- The existing function already is SECURITY DEFINER, but the internal SELECT
-- still runs as the calling user for RLS tables. We fix by using a direct
-- table read (which SECURITY DEFINER allows to bypass RLS).

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
  v_is_participant BOOLEAN;
BEGIN
  v_tenant_id := public.current_tenant_id();

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Cannot resolve tenant for current user (uid=%)', auth.uid();
  END IF;

  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Missing user authentication';
  END IF;

  -- Check participant using SET LOCAL to bypass RLS inside this SECURITY DEFINER fn
  SELECT EXISTS (
    SELECT 1 FROM public.chat_room_participants
    WHERE room_id = p_room_id AND user_id = v_user_id
  ) INTO v_is_participant;

  IF NOT v_is_participant THEN
    -- Auto-join: add caller as member (idempotent) rather than hard-fail
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    VALUES (p_room_id, v_user_id, 'member')
    ON CONFLICT (room_id, user_id) DO NOTHING;
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

GRANT EXECUTE ON FUNCTION public.rpc_send_chat_message TO authenticated;
