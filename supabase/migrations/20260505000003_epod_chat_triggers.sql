-- ePOD Phase 3: Auto-notify chat room on delivery events
-- Trigger 1: Customer signature saved → system chat message
-- Trigger 2: Journey log updated     → system chat message per step

-- ── Journey status labels (Vietnamese) ──
-- Used inside both trigger functions so defined once as inline CASE.

-- ════════════════════════════════════════════════════════════
-- TRIGGER 1: Customer signature → chat system message
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.trg_fn_epod_signature_to_chat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id    UUID;
  v_item_count INT;
  v_cust_name  TEXT;
  v_signed_str TEXT;
  v_msg        TEXT;
BEGIN
  -- Only fire when signature transitions NULL → NOT NULL
  IF NEW.customer_signature_url IS NULL
     OR OLD.customer_signature_url IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Find chat room for this shipment
  SELECT id INTO v_room_id
  FROM public.chat_rooms
  WHERE entity_type = 'shipment'
    AND entity_id   = NEW.id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW; -- No chat room yet, silently skip
  END IF;

  -- Customer name
  SELECT name INTO v_cust_name
  FROM public.customers
  WHERE id = NEW.customer_id;

  -- Item count
  SELECT COUNT(*) INTO v_item_count
  FROM public.shipment_items
  WHERE shipment_id = NEW.id;

  -- Format signed_at (default to NOW if somehow NULL)
  v_signed_str := TO_CHAR(
    COALESCE(NEW.signed_at, NOW()) AT TIME ZONE 'Asia/Ho_Chi_Minh',
    'HH24:MI DD/MM/YYYY'
  );

  v_msg := format(
    '✅ Khách hàng %s đã ký xác nhận nhận hàng lúc %s. Giao đủ %s dòng hàng. (Phiếu %s)',
    COALESCE(v_cust_name, 'khách hàng'),
    v_signed_str,
    v_item_count,
    NEW.shipment_number
  );

  INSERT INTO public.chat_messages (
    id,
    client_id,
    tenant_id,
    room_id,
    sender_id,
    message_type,
    content,
    status,
    created_at
  ) VALUES (
    gen_random_uuid(),
    gen_random_uuid(),
    NEW.tenant_id,
    v_room_id,
    NULL,           -- system message — no human sender
    'system_epod',  -- green banner in chat UI
    v_msg,
    'sent',
    NOW()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_epod_signature_to_chat ON public.shipments;
CREATE TRIGGER trg_epod_signature_to_chat
  AFTER UPDATE OF customer_signature_url ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_epod_signature_to_chat();


-- ════════════════════════════════════════════════════════════
-- TRIGGER 2: Journey log INSERT → chat system message
-- Notifies admin dashboard of each delivery milestone
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.trg_fn_epod_journey_to_chat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id    UUID;
  v_tenant_id  UUID;
  v_ship_num   TEXT;
  v_step_label TEXT;
  v_driver_name TEXT;
  v_msg        TEXT;
BEGIN
  -- Map journey_status to Vietnamese label + emoji
  v_step_label := CASE NEW.journey_status
    WHEN 'pending_pickup'      THEN '📋 Chờ lấy hàng'
    WHEN 'picked_up'           THEN '📦 Đã lấy hàng từ kho'
    WHEN 'in_transit'          THEN '🚚 Đang trên đường giao'
    WHEN 'arrived'             THEN '📍 Đã đến địa điểm giao'
    WHEN 'delivered_confirmed' THEN '✅ Giao hàng hoàn tất'
    ELSE NEW.journey_status
  END;

  -- Get tenant_id + shipment_number from shipments
  SELECT tenant_id, shipment_number
  INTO v_tenant_id, v_ship_num
  FROM public.shipments
  WHERE id = NEW.shipment_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Find chat room
  SELECT id INTO v_room_id
  FROM public.chat_rooms
  WHERE entity_type = 'shipment'
    AND entity_id   = NEW.shipment_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Driver name from updated_by (profiles table)
  SELECT full_name INTO v_driver_name
  FROM public.profiles
  WHERE id = NEW.updated_by::UUID;

  -- Build message
  IF v_driver_name IS NOT NULL THEN
    v_msg := format(
      '%s — %s (%s)',
      v_step_label,
      v_driver_name,
      TO_CHAR(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI')
    );
  ELSE
    v_msg := format(
      '%s — Phiếu %s (%s)',
      v_step_label,
      v_ship_num,
      TO_CHAR(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI')
    );
  END IF;

  IF NEW.notes IS NOT NULL AND NEW.notes <> '' THEN
    v_msg := v_msg || format(' · Ghi chú: %s', NEW.notes);
  END IF;

  INSERT INTO public.chat_messages (
    id,
    client_id,
    tenant_id,
    room_id,
    sender_id,
    message_type,
    content,
    status,
    created_at
  ) VALUES (
    gen_random_uuid(),
    gen_random_uuid(),
    v_tenant_id,
    v_room_id,
    NULL,
    'system',
    v_msg,
    'sent',
    NOW()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_epod_journey_to_chat ON public.shipment_journey_logs;
CREATE TRIGGER trg_epod_journey_to_chat
  AFTER INSERT ON public.shipment_journey_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_epod_journey_to_chat();
