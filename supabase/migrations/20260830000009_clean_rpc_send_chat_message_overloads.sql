-- ============================================================
-- Migration: Clean old overloads of rpc_send_chat_message
-- Description: Drops legacy function overloads and creates canonical signature with reply support
-- ============================================================

DROP FUNCTION IF EXISTS public.rpc_send_chat_message(UUID, UUID, TEXT, VARCHAR, TEXT, JSONB, TEXT, TEXT, VARCHAR);
DROP FUNCTION IF EXISTS public.rpc_send_chat_message(UUID, UUID, TEXT, VARCHAR, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.rpc_send_chat_message(UUID, UUID, TEXT, VARCHAR);
DROP FUNCTION IF EXISTS public.rpc_send_chat_message(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.rpc_send_chat_message(UUID, UUID, TEXT, VARCHAR, TEXT, JSONB, TEXT, TEXT, VARCHAR, UUID, JSONB);

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

GRANT EXECUTE ON FUNCTION public.rpc_send_chat_message(UUID, UUID, TEXT, VARCHAR, TEXT, JSONB, TEXT, TEXT, VARCHAR, UUID, JSONB) TO authenticated;
