-- Migration: Harden Order Progress Milestone Push Notification Trigger
-- Function: trg_fn_order_progress_milestone

CREATE OR REPLACE FUNCTION public.trg_fn_order_progress_milestone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order record;
  v_customer_user record;
  v_stage_name text;
  v_stage_desc text;
  v_edge_fn_url text;
  v_service_key text;
  v_payload jsonb;
  v_notif_id uuid;
BEGIN
  -- 1. Guard check: only proceed when status is 'done' and was not already 'done'
  IF NEW.status = 'done' THEN
    IF TG_OP = 'UPDATE' THEN
      IF OLD.status = 'done' THEN
        RETURN NEW;
      END IF;
    END IF;
    
    -- 2. Fetch Order info
    SELECT id, order_number, customer_id, tenant_id
    INTO v_order
    FROM public.orders
    WHERE id = NEW.order_id;

    IF v_order.id IS NULL OR v_order.customer_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- 3. Map Stage to friendly Vietnamese message
    CASE NEW.stage
      WHEN 'warping' THEN
        v_stage_name := 'Mắc sợi';
        v_stage_desc := 'Nguyên liệu sợi đã sẵn sàng! Đơn hàng đã được nạp vào máy dệt.';
      WHEN 'weaving' THEN
        v_stage_name := 'Dệt mộc';
        v_stage_desc := 'Đã dệt xong toàn bộ vải mộc! Đang chuyển sang khâu kiểm tra mộc.';
      WHEN 'greige_check' THEN
        v_stage_name := 'Kiểm vải mộc';
        v_stage_desc := 'Vải mộc đã đạt chuẩn chất lượng, sẵn sàng xuất sang xưởng nhuộm.';
      WHEN 'dyeing' THEN
        v_stage_name := 'Nhuộm màu';
        v_stage_desc := 'Mẻ vải đã nhuộm đúng mã màu tiêu chuẩn và hoàn tất giặt sấy.';
      WHEN 'finishing' THEN
        v_stage_name := 'Hoàn tất căng kim';
        v_stage_desc := 'Đã hoàn tất căng kim định hình và xử lý chống co giãn.';
      WHEN 'final_check' THEN
        v_stage_name := 'Kiểm thành phẩm';
        v_stage_desc := 'KCS đã kiểm tra đạt 100% tiêu chuẩn chất lượng xuất xưởng.';
      WHEN 'packing' THEN
        v_stage_name := 'Đóng gói';
        v_stage_desc := 'Đã dán tem mã vạch QR, đóng gói hoàn chỉnh và sẵn sàng giao hàng!';
      ELSE
        v_stage_name := NEW.stage;
        v_stage_desc := 'Công đoạn ' || NEW.stage || ' đã hoàn thành.';
    END CASE;

    -- 4. Loop through all customer users attached to this customer
    FOR v_customer_user IN
      SELECT id FROM public.profiles WHERE customer_id = v_order.customer_id
    LOOP
      v_notif_id := gen_random_uuid();

      -- Insert into notifications table
      INSERT INTO public.notifications (
        id,
        user_id,
        title,
        body,
        entity_type,
        entity_id,
        action,
        domain,
        is_read,
        tenant_id,
        created_at
      ) VALUES (
        v_notif_id,
        v_customer_user.id,
        'Tiến độ đơn hàng #' || COALESCE(v_order.order_number, ''),
        v_stage_name || ': ' || v_stage_desc,
        'order',
        v_order.id::text,
        'order_progress',
        'orders',
        false,
        v_order.tenant_id,
        now()
      );

      -- 5. Invoke Web Push Edge Function asynchronously via pg_net (High Urgency)
      BEGIN
        v_edge_fn_url := 'https://sxphijrofljxkccdwtub.supabase.co/functions/v1/send-web-push';
        v_service_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUwOTU1OSwiZXhwIjoyMDkwMDg1NTU5fQ.DKems71L40cRKbHqQTxVWKSXgdYkBR525DWuX4ARyaU';

        v_payload := jsonb_build_object(
          'notification_id', v_notif_id::text,
          'user_id', v_customer_user.id::text,
          'domain', 'orders',
          'title', 'VinhPhatERP • Đơn hàng #' || COALESCE(v_order.order_number, ''),
          'body', v_stage_name || ': ' || v_stage_desc,
          'entity_type', 'order',
          'entity_id', v_order.id::text,
          'action', 'order_progress',
          'priority', 'high'
        );

        PERFORM net.http_post(
          url := v_edge_fn_url,
          body := v_payload,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_key
          )
        );
      EXCEPTION WHEN OTHERS THEN
        -- Fail-safe: do not block transaction if pg_net call fails
        RAISE WARNING 'Push notification dispatch failed: %', SQLERRM;
      END;

    END LOOP;

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_progress_milestone ON public.order_progress;
CREATE TRIGGER trg_order_progress_milestone
AFTER INSERT OR UPDATE OF status ON public.order_progress
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_order_progress_milestone();
