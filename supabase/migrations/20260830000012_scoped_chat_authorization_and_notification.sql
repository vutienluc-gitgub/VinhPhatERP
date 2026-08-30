-- ============================================================
-- Migration: Enterprise Scoped Chat Authorization & Decoupled Notification Engine (Method C)
-- Description:
-- 1. Creates centralized authorization abstraction: fn_can_access_chat_room(p_room_id, p_user_id)
-- 2. Creates decoupled notification resolver: fn_resolve_chat_notification_recipients(p_message_id)
-- 3. Updates fn_sync_room_participants to scoped business assignments (NOT global staff)
-- 4. Updates rpc_get_chat_messages & rpc_send_chat_message with unified authorization
-- 5. Updates message inserted trigger to dispatch notifications via policy resolver
-- ============================================================

-- ── 1. Centralized Authorization Function ──
CREATE OR REPLACE FUNCTION public.fn_can_access_chat_room(
  p_room_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
  v_room RECORD;
  v_caller RECORD;
  v_participant_role TEXT;
BEGIN
  -- 1. Input Guard
  IF p_user_id IS NULL OR p_room_id IS NULL THEN
    RETURN false;
  END IF;

  -- 2. Fetch room info
  SELECT id, tenant_id, entity_type, entity_id
  INTO v_room
  FROM public.chat_rooms
  WHERE id = p_room_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- 3. Fetch caller profile
  SELECT id, tenant_id, role::text, customer_id, supplier_id, is_active
  INTO v_caller
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND OR v_caller.is_active = false THEN
    RETURN false;
  END IF;

  -- 4. TENANT ISOLATION (Highest Invariant)
  IF v_caller.tenant_id IS NOT NULL AND v_room.tenant_id IS NOT NULL THEN
    IF v_caller.tenant_id <> v_room.tenant_id THEN
      RETURN false;
    END IF;
  END IF;

  -- 5. GLOBAL ADMIN / DIRECTORS
  IF v_caller.role IN ('admin', 'director', 'general_manager') THEN
    RETURN true;
  END IF;

  -- 6. EXPLICIT PARTICIPANT RECORD (Invited / Assigned Member)
  SELECT role INTO v_participant_role
  FROM public.chat_room_participants
  WHERE room_id = p_room_id AND user_id = p_user_id;

  IF FOUND THEN
    RETURN true;
  END IF;

  -- 7. SCOPED BUSINESS ROLES
  -- 7a. Customer Rooms
  IF v_room.entity_type = 'customer' THEN
    -- External customer checking own room
    IF v_caller.customer_id IS NOT NULL AND v_caller.customer_id = v_room.entity_id::UUID THEN
      RETURN true;
    END IF;
    -- Assigned Salesperson
    IF EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = v_room.entity_id::UUID AND c.salesperson_id = p_user_id
    ) THEN
      RETURN true;
    END IF;
    -- Sales Department Managers / Leads
    IF v_caller.role IN ('sales_manager', 'sales_lead') THEN
      RETURN true;
    END IF;
  END IF;

  -- 7b. Shipment Rooms
  IF v_room.entity_type = 'shipment' THEN
    -- Assigned Driver / Delivery Staff
    IF EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = v_room.entity_id::UUID AND s.delivery_staff_id = p_user_id
    ) THEN
      RETURN true;
    END IF;
    -- Customer for this shipment
    IF v_caller.customer_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = v_room.entity_id::UUID AND s.customer_id = v_caller.customer_id
    ) THEN
      RETURN true;
    END IF;
    -- Logistics & Warehouse Staff / Managers
    IF v_caller.role IN ('warehouse', 'kho', 'logistics_manager', 'operator', 'supervisor') THEN
      RETURN true;
    END IF;
  END IF;

  -- 7c. Supplier Rooms
  IF v_room.entity_type = 'supplier' THEN
    -- External supplier checking own room
    IF v_caller.supplier_id IS NOT NULL AND v_caller.supplier_id = v_room.entity_id::UUID THEN
      RETURN true;
    END IF;
    -- Purchasing Staff / Managers / Accountants
    IF v_caller.role IN ('purchasing_manager', 'buyer', 'accountant') THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ── 2. Decoupled Notification Resolver ──
CREATE OR REPLACE FUNCTION public.fn_resolve_chat_notification_recipients(
  p_message_id UUID
)
RETURNS UUID[] AS $$
DECLARE
  v_msg RECORD;
  v_room RECORD;
  v_candidates UUID[] := '{}';
  v_final_recipients UUID[] := '{}';
BEGIN
  -- 1. Fetch message and room context
  SELECT id, room_id, sender_id, tenant_id
  INTO v_msg
  FROM public.chat_messages
  WHERE id = p_message_id;

  IF NOT FOUND THEN RETURN '{}'; END IF;

  SELECT id, entity_type, entity_id, tenant_id
  INTO v_room
  FROM public.chat_rooms
  WHERE id = v_msg.room_id;

  IF NOT FOUND THEN RETURN '{}'; END IF;

  -- 2. CANDIDATE SELECTION BY NOTIFICATION POLICY
  -- Policy A: Explicit participants of the room (excluding sender)
  SELECT COALESCE(array_agg(p.user_id), '{}')
  INTO v_candidates
  FROM public.chat_room_participants p
  WHERE p.room_id = v_room.id
    AND p.user_id <> v_msg.sender_id;

  -- Policy B: If Customer room -> also notify assigned salesperson
  IF v_room.entity_type = 'customer' THEN
    SELECT COALESCE(v_candidates || c.salesperson_id, v_candidates)
    INTO v_candidates
    FROM public.customers c
    WHERE c.id = v_room.entity_id::UUID
      AND c.salesperson_id IS NOT NULL
      AND c.salesperson_id <> v_msg.sender_id;
  END IF;

  -- Policy C: If Shipment room -> notify delivery staff or logistics manager
  IF v_room.entity_type = 'shipment' THEN
    SELECT COALESCE(v_candidates || s.delivery_staff_id, v_candidates)
    INTO v_candidates
    FROM public.shipments s
    WHERE s.id = v_room.entity_id::UUID
      AND s.delivery_staff_id IS NOT NULL
      AND s.delivery_staff_id <> v_msg.sender_id;
  END IF;

  -- 3. STRICT SECURITY FILTER: Candidate MUST be authorized to access the room
  SELECT COALESCE(array_agg(DISTINCT cand.uid), '{}')
  INTO v_final_recipients
  FROM unnest(v_candidates) AS cand(uid)
  WHERE public.fn_can_access_chat_room(v_room.id, cand.uid) = true;

  RETURN v_final_recipients;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ── 3. Refactored Scoped Participant Sync ──
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

  -- 1. Sync Customer Rooms (External customer + Assigned salesperson + Sales managers)
  IF v_room.entity_type = 'customer' THEN
    -- External customer profiles
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    SELECT v_room.id, p.id, 'external_client'
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.customer_id = v_room.entity_id::UUID
      AND p.is_active = true
    ON CONFLICT (room_id, user_id) DO UPDATE SET role = 'external_client';

    -- Assigned salesperson
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    SELECT v_room.id, c.salesperson_id, 'assigned_staff'
    FROM public.customers c
    JOIN auth.users u ON c.salesperson_id = u.id
    WHERE c.id = v_room.entity_id::UUID
      AND c.salesperson_id IS NOT NULL
    ON CONFLICT (room_id, user_id) DO UPDATE SET role = 'assigned_staff';

    -- Admins and Sales managers
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    SELECT v_room.id, p.id, 'manager'
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.tenant_id = v_room.tenant_id
      AND p.role::text IN ('admin', 'sales_manager', 'director')
      AND p.is_active = true
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;

  -- 2. Sync Shipment Rooms (Driver + Customer + Logistics/Warehouse staff)
  IF v_room.entity_type = 'shipment' THEN
    -- Driver / Delivery staff
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    SELECT v_room.id, s.delivery_staff_id, 'external_client'
    FROM public.shipments s
    JOIN auth.users u ON s.delivery_staff_id = u.id
    WHERE s.id = v_room.entity_id::UUID
      AND s.delivery_staff_id IS NOT NULL
    ON CONFLICT (room_id, user_id) DO UPDATE SET role = 'external_client';

    -- Customer for this shipment
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    SELECT v_room.id, p.id, 'external_client'
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    JOIN public.shipments s ON p.customer_id = s.customer_id
    WHERE s.id = v_room.entity_id::UUID
      AND p.is_active = true
    ON CONFLICT (room_id, user_id) DO UPDATE SET role = 'external_client';

    -- Warehouse / Logistics managers & staff
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    SELECT v_room.id, p.id, 'assigned_staff'
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.tenant_id = v_room.tenant_id
      AND p.role::text IN ('admin', 'logistics_manager', 'warehouse', 'kho')
      AND p.is_active = true
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;

  -- 3. Sync Supplier Rooms (Supplier + Purchasing staff / Managers)
  IF v_room.entity_type = 'supplier' THEN
    -- External supplier profiles
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    SELECT v_room.id, p.id, 'external_client'
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.supplier_id = v_room.entity_id::UUID
      AND p.is_active = true
    ON CONFLICT (room_id, user_id) DO UPDATE SET role = 'external_client';

    -- Purchasing managers and buyers
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    SELECT v_room.id, p.id, 'assigned_staff'
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.tenant_id = v_room.tenant_id
      AND p.role::text IN ('admin', 'purchasing_manager', 'buyer', 'accountant')
      AND p.is_active = true
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ── 4. Update rpc_get_chat_messages with centralized authorization ──
CREATE OR REPLACE FUNCTION public.rpc_get_chat_messages(
  p_room_id UUID,
  p_cursor TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_is_authorized BOOLEAN;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Missing user authentication';
  END IF;

  -- Verify authorization via unified policy abstraction
  v_is_authorized := public.fn_can_access_chat_room(p_room_id, v_user_id);

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Access denied to room %', p_room_id;
  END IF;

  WITH msg_page AS (
    SELECT m.*, sp.full_name AS sender_full_name, sp.role AS sender_user_role, sp.avatar_url AS sender_avatar
    FROM public.chat_messages m
    LEFT JOIN public.profiles sp ON m.sender_id = sp.id
    WHERE m.room_id = p_room_id
      AND m.deleted_at IS NULL
      AND (p_cursor IS NULL OR m.created_at < p_cursor)
    ORDER BY m.created_at DESC
    LIMIT LEAST(p_limit, 100)
  ),
  msg_reactions AS (
    SELECT
      r.message_id,
      jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'message_id', r.message_id,
          'user_id', r.user_id,
          'user_name', COALESCE(p.full_name, 'Thành viên'),
          'emoji', r.emoji,
          'created_at', r.created_at
        )
        ORDER BY r.created_at ASC
      ) AS reactions
    FROM public.chat_message_reactions r
    JOIN msg_page mp ON r.message_id = mp.id
    LEFT JOIN public.profiles p ON r.user_id = p.id
    GROUP BY r.message_id
  ),
  ordered_page AS (
    SELECT
      mp.id,
      mp.client_id,
      mp.tenant_id,
      mp.room_id,
      mp.sender_id,
      mp.sender_full_name,
      mp.sender_user_role,
      mp.sender_avatar,
      mp.message_type,
      mp.content,
      mp.image_url,
      mp.file_url,
      mp.file_name,
      mp.file_type,
      mp.reply_to_id,
      mp.reply_to_message,
      mp.status,
      mp.mentions,
      mp.is_pinned,
      mp.pinned_at,
      mp.pinned_by,
      mp.created_at,
      mp.deleted_at,
      COALESCE(mr.reactions, '[]'::jsonb) AS reactions
    FROM msg_page mp
    LEFT JOIN msg_reactions mr ON mp.id = mr.message_id
    ORDER BY mp.created_at ASC
  )
  SELECT jsonb_build_object(
    'messages', COALESCE(jsonb_agg(to_jsonb(op)), '[]'::jsonb),
    'has_more', (SELECT COUNT(*) FROM msg_page) = LEAST(p_limit, 100),
    'next_cursor', (SELECT MIN(created_at) FROM msg_page)
  )
  INTO v_result
  FROM ordered_page op;

  RETURN COALESCE(v_result, jsonb_build_object(
    'messages', '[]'::jsonb,
    'has_more', false,
    'next_cursor', NULL
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ── 5. Update rpc_send_chat_message with unified authorization & observer check ──
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
  v_is_authorized BOOLEAN;
  v_participant_role TEXT;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Missing user authentication';
  END IF;

  -- 1. Verify authorization via unified policy
  v_is_authorized := public.fn_can_access_chat_room(p_room_id, v_user_id);

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Access denied: user % is not authorized for room %', v_user_id, p_room_id;
  END IF;

  -- 2. Observer Role check: Observers cannot send messages (Read-only)
  SELECT role INTO v_participant_role
  FROM public.chat_room_participants
  WHERE room_id = p_room_id AND user_id = v_user_id;

  IF v_participant_role = 'observer' THEN
    RAISE EXCEPTION 'Access denied: observer role is read-only in room %', p_room_id;
  END IF;

  -- 3. Resolve tenant
  SELECT tenant_id INTO v_tenant_id
  FROM public.chat_rooms
  WHERE id = p_room_id;

  -- 4. Idempotent Insert
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ── 6. Update message trigger to use decoupled notification resolver ──
CREATE OR REPLACE FUNCTION public.trg_fn_chat_message_inserted()
RETURNS TRIGGER AS $$
DECLARE
  v_recipients UUID[];
  v_sender_name TEXT;
  v_room RECORD;
  v_payload JSONB;
BEGIN
  -- 1. Increment unread count ONLY for explicit participants (excluding sender)
  UPDATE public.chat_room_participants
  SET unread_count = unread_count + 1
  WHERE room_id = NEW.room_id
    AND user_id <> NEW.sender_id;

  -- 2. Resolve final notification recipients via policy resolver
  v_recipients := public.fn_resolve_chat_notification_recipients(NEW.id);

  IF array_length(v_recipients, 1) IS NOT NULL AND array_length(v_recipients, 1) > 0 THEN
    -- Resolve sender name
    SELECT COALESCE(full_name, 'Thành viên')
    INTO v_sender_name
    FROM public.profiles
    WHERE id = NEW.sender_id;

    -- Resolve room context
    SELECT id, entity_type, entity_id, tenant_id
    INTO v_room
    FROM public.chat_rooms
    WHERE id = NEW.room_id;

    v_payload := jsonb_build_object(
      'message_id', NEW.id,
      'room_id', NEW.room_id,
      'sender_id', NEW.sender_id,
      'sender_name', COALESCE(v_sender_name, 'Hệ thống'),
      'content', CASE 
        WHEN NEW.message_type = 'image' THEN 'Đã gửi một hình ảnh'
        WHEN NEW.message_type = 'file' THEN 'Đã gửi một tệp đính kèm'
        ELSE LEFT(NEW.content, 200)
      END,
      'entity_type', v_room.entity_type,
      'entity_id', v_room.entity_id,
      'recipients', to_jsonb(v_recipients)
    );

    -- Dispatch asynchronous HTTP push notification via pg_net
    PERFORM net.http_post(
      url := 'https://' || current_setting('request.headers', true)::json->>'host' || '/functions/v1/send-web-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('supabase.auth.token', true)
      ),
      body := v_payload
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ── 7. Grants ──
GRANT EXECUTE ON FUNCTION public.fn_can_access_chat_room(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_resolve_chat_notification_recipients(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_sync_room_participants(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_chat_messages(UUID, TIMESTAMPTZ, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_send_chat_message(UUID, UUID, TEXT, VARCHAR, TEXT, JSONB, TEXT, TEXT, VARCHAR, UUID, JSONB) TO authenticated;
