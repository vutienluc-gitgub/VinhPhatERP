-- ============================================================
-- Migration: Fix chat_rooms entity_id type mismatch in rpc_get_or_create_chat_room
-- Description:
-- Removes redundant and harmful '::TEXT' cast on p_entity_id (UUID)
-- when inserting into or selecting from public.chat_rooms (entity_id UUID NOT NULL).
-- Fixes: "column \"entity_id\" is of type uuid but expression is of type text"
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_get_or_create_chat_room(
  p_entity_type TEXT,
  p_entity_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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

  -- Upsert room (idempotent) - p_entity_id is UUID matching chat_rooms.entity_id (UUID)
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
$$;

-- Explicitly re-grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.rpc_get_or_create_chat_room(TEXT, UUID) TO authenticated;
