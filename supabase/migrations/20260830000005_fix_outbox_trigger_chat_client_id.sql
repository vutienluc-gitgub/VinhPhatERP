-- ============================================================
-- Migration: Fix Chat Messages client_id in Logistics Outbox Trigger (LES v2.1)
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_fn_logistics_outbox_dispatched()
RETURNS TRIGGER AS $$
DECLARE
  v_shipment_id UUID;
  v_room_id UUID;
  v_msg_content TEXT;
  v_msg_type VARCHAR(50) := 'system';
  v_receiver_name TEXT;
  v_driver_name TEXT;
  v_time_str TEXT;
BEGIN
  v_time_str := TO_CHAR(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI');

  -- 1. Resolve Shipment ID from attempt
  SELECT s.id INTO v_shipment_id
  FROM public.delivery_attempts a
  JOIN public.delivery_stops ds ON a.stop_id = ds.id
  JOIN public.shipments s ON ds.shipment_id = s.id
  WHERE a.id = NEW.aggregate_id
  LIMIT 1;

  -- 2. Resolve Chat Room for this Shipment
  IF v_shipment_id IS NOT NULL THEN
    SELECT id INTO v_room_id
    FROM public.chat_rooms
    WHERE entity_type = 'shipment'
      AND entity_id = v_shipment_id
    LIMIT 1;
  END IF;

  -- 3. Resolve Driver Name
  IF NEW.payload->>'actor_id' IS NOT NULL AND NEW.payload->>'actor_id' != '00000000-0000-0000-0000-000000000000' THEN
    SELECT full_name INTO v_driver_name
    FROM public.profiles
    WHERE id = (NEW.payload->>'actor_id')::UUID;
  END IF;

  -- 4. Formulate System Chat Content & Type
  IF NEW.event_type = 'DELIVERY.PICKUP_CONFIRMED' THEN
    v_msg_content := format('📦 Đã lấy hàng từ kho — %s (%s)', COALESCE(v_driver_name, 'Tài xế'), v_time_str);
  ELSIF NEW.event_type = 'DELIVERY.TRANSIT_STARTED' THEN
    v_msg_content := format('🚚 Đang trên đường giao — %s (%s)', COALESCE(v_driver_name, 'Tài xế'), v_time_str);
  ELSIF NEW.event_type = 'DELIVERY.DRIVER_ARRIVED' THEN
    v_msg_content := format('📍 Đã đến địa điểm giao — %s (%s)', COALESCE(v_driver_name, 'Tài xế'), v_time_str);
  ELSIF NEW.event_type = 'DELIVERY.EPOD_SUBMITTED' THEN
    v_receiver_name := COALESCE(NEW.payload->>'receiver_name', 'Khách hàng');
    v_msg_type := 'system_epod';
    v_msg_content := format('✅ Giao hàng hoàn tất — %s đã ký nhận lúc %s', v_receiver_name, v_time_str);
  ELSIF NEW.event_type = 'DELIVERY.EXCEPTION_OCCURRED' THEN
    v_msg_content := format('⚠️ Sự cố giao hàng: %s (%s)', COALESCE(NEW.payload->>'reason_detail', 'Chưa rõ lý do'), v_time_str);
  ELSE
    v_msg_content := format('ℹ️ Cập nhật hành trình: %s (%s)', NEW.event_type, v_time_str);
  END IF;

  -- 5. Insert Projection into Chat Messages (with gen_random_uuid() client_id)
  IF v_room_id IS NOT NULL AND v_msg_content IS NOT NULL THEN
    INSERT INTO public.chat_messages (
      client_id, tenant_id, room_id, sender_id, message_type, content, status, created_at
    ) VALUES (
      gen_random_uuid(), NEW.tenant_id, v_room_id, NULL, v_msg_type, v_msg_content, 'sent', NOW()
    );
  END IF;

  -- 6. Trigger Async Web Push Notification via net.http_post
  BEGIN
    PERFORM net.http_post(
      url := coalesce(
        nullif(current_setting('app.settings.edge_function_url', true), ''),
        'https://sxphijrofljxkccdwtub.supabase.co/functions/v1/send-web-push'
      ),
      body := jsonb_build_object(
        'type', 'LOGISTICS_EVENT',
        'event_id', NEW.id,
        'event_type', NEW.event_type,
        'aggregate_id', NEW.aggregate_id,
        'payload', NEW.payload
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(
          nullif(current_setting('app.settings.edge_function_anon_key', true), ''),
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDk1NTksImV4cCI6MjA5MDA4NTU1OX0.8e-qbhqv6UgCZ46Yx7sa9FWGCdT50q27i4kAiMtCpxc'
        )
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[trg_fn_logistics_outbox_dispatched] Web push dispatch notice: %', SQLERRM;
  END;

  -- 7. Mark Outbox Item as Dispatched
  NEW.status := 'dispatched';
  NEW.dispatched_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
