-- ============================================================
-- Migration: Enforce Strict Sender Membership & Authorization Boundary in Chat RPCs
-- Description:
-- 1. Enforces strict participant validation in rpc_send_chat_message
-- 2. Enforces caller entity authorization in rpc_get_or_create_chat_room
-- 3. Aborts and raises 'Access denied' if caller is not an authorized member
-- ============================================================

-- ── 1. Update rpc_get_or_create_chat_room with authorization check ──
CREATE OR REPLACE FUNCTION public.rpc_get_or_create_chat_room(
  p_entity_type TEXT,
  p_entity_id UUID
) RETURNS UUID AS $$
DECLARE
  v_room_id UUID;
  v_tenant_id UUID;
  v_user_id UUID;
  v_caller_role TEXT;
  v_caller_customer_id UUID;
  v_caller_supplier_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Missing user authentication';
  END IF;

  v_tenant_id := public.current_tenant_id();

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Cannot resolve tenant for current user';
  END IF;

  -- Verify caller authorization for this entity
  SELECT p.role::TEXT, p.customer_id, p.supplier_id
  INTO v_caller_role, v_caller_customer_id, v_caller_supplier_id
  FROM public.profiles p
  WHERE p.id = v_user_id;

  -- External customer can ONLY access their own customer room
  IF v_caller_customer_id IS NOT NULL THEN
    IF p_entity_type <> 'customer' OR p_entity_id <> v_caller_customer_id THEN
      RAISE EXCEPTION 'Access denied: customer cannot access external room % %', p_entity_type, p_entity_id;
    END IF;
  END IF;

  -- External supplier can ONLY access their own supplier room
  IF v_caller_supplier_id IS NOT NULL THEN
    IF p_entity_type <> 'supplier' OR p_entity_id <> v_caller_supplier_id THEN
      RAISE EXCEPTION 'Access denied: supplier cannot access external room % %', p_entity_type, p_entity_id;
    END IF;
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

  -- Synchronize all room participants (target entity users + internal staff)
  PERFORM public.fn_sync_room_participants(v_room_id);

  -- Strictly verify caller is now an authorized participant
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_room_participants
    WHERE room_id = v_room_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied: user % is not an authorized participant for % %', v_user_id, p_entity_type, p_entity_id;
  END IF;

  RETURN v_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. Update rpc_send_chat_message with strict sender membership enforcement ──
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

  -- Resolve tenant from room
  SELECT tenant_id INTO v_tenant_id
  FROM public.chat_rooms
  WHERE id = p_room_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Chat room % does not exist', p_room_id;
  END IF;

  -- Synchronize room participants
  PERFORM public.fn_sync_room_participants(p_room_id);

  -- STRICT MEMBERSHIP ENFORCEMENT: Caller MUST be a participant
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_room_participants
    WHERE room_id = p_room_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied: user % is not an authorized participant of room %', v_user_id, p_room_id;
  END IF;

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

GRANT EXECUTE ON FUNCTION public.rpc_get_or_create_chat_room(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_send_chat_message(UUID, UUID, TEXT, VARCHAR, TEXT, JSONB, TEXT, TEXT, VARCHAR, UUID, JSONB) TO authenticated;
