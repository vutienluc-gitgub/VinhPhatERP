-- ============================================================
-- Migration: 20260912000002_webhook_security_and_idempotency.sql
-- Description: P0 Webhook Security Remediation:
--   1. Purge all hardcoded service_role and anon keys from trigger functions
--   2. Create database-backed inbound_webhook_events table with unique constraints
--   3. Create atomic idempotency and domain transaction RPCs
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Inbound Webhook Events Table (Database-backed Idempotency)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inbound_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(100) NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'received', -- 'received', 'processing', 'processed', 'failed', 'duplicate'
  attempt_count INT NOT NULL DEFAULT 1,
  last_error TEXT,
  request_id VARCHAR(100),
  received_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  CONSTRAINT uq_inbound_webhook_events_source_event UNIQUE (source, event_id)
);

CREATE INDEX IF NOT EXISTS idx_inbound_webhook_events_status ON public.inbound_webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_inbound_webhook_events_received_at ON public.inbound_webhook_events(received_at);

ALTER TABLE public.inbound_webhook_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inbound_webhook_events' AND policyname = 'service_role_all_inbound_webhook_events'
  ) THEN
    CREATE POLICY service_role_all_inbound_webhook_events ON public.inbound_webhook_events
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. Atomic Idempotency Claim RPC (Race Condition Protection)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.rpc_record_inbound_webhook_event(
  p_source TEXT,
  p_event_id TEXT,
  p_event_type TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_request_id TEXT DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing RECORD;
  v_new_id UUID;
BEGIN
  -- 1. Check existing record
  SELECT id, status, attempt_count, received_at
  INTO v_existing
  FROM public.inbound_webhook_events
  WHERE source = p_source AND event_id = p_event_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.status = 'processed' THEN
      RETURN jsonb_build_object(
        'status', 'duplicate',
        'is_duplicate', true,
        'message', 'Event has already been processed',
        'event_id', p_event_id,
        'record_id', v_existing.id
      );
    ELSIF v_existing.status = 'processing' AND v_existing.received_at > clock_timestamp() - INTERVAL '5 minutes' THEN
      RETURN jsonb_build_object(
        'status', 'in_flight',
        'is_duplicate', true,
        'message', 'Event is currently being processed by another worker',
        'event_id', p_event_id,
        'record_id', v_existing.id
      );
    ELSE
      -- Previously failed or abandoned in-flight: allow retry attempt
      UPDATE public.inbound_webhook_events
      SET status = 'processing',
          attempt_count = attempt_count + 1,
          received_at = clock_timestamp(),
          request_id = coalesce(p_request_id, request_id)
      WHERE id = v_existing.id;

      RETURN jsonb_build_object(
        'status', 'retry',
        'is_duplicate', false,
        'attempt_count', v_existing.attempt_count + 1,
        'event_id', p_event_id,
        'record_id', v_existing.id
      );
    END IF;
  END IF;

  -- 2. Insert new record atomically with race protection
  INSERT INTO public.inbound_webhook_events (
    source,
    event_id,
    event_type,
    payload,
    status,
    attempt_count,
    request_id,
    tenant_id,
    received_at
  ) VALUES (
    p_source,
    p_event_id,
    p_event_type,
    p_payload,
    'processing',
    1,
    p_request_id,
    p_tenant_id,
    clock_timestamp()
  )
  ON CONFLICT (source, event_id) DO NOTHING
  RETURNING id INTO v_new_id;

  IF v_new_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'duplicate',
      'is_duplicate', true,
      'message', 'Event was inserted concurrently by another worker',
      'event_id', p_event_id
    );
  END IF;

  RETURN jsonb_build_object(
    'status', 'accepted',
    'is_duplicate', false,
    'event_id', p_event_id,
    'record_id', v_new_id
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. Atomic Idempotency Completion RPC
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.rpc_complete_inbound_webhook_event(
  p_source TEXT,
  p_event_id TEXT,
  p_status TEXT,
  p_error TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.inbound_webhook_events
  SET status = p_status,
      last_error = p_error,
      processed_at = CASE WHEN p_status = 'processed' THEN clock_timestamp() ELSE processed_at END
  WHERE source = p_source AND event_id = p_event_id;

  RETURN jsonb_build_object('success', true, 'status', p_status);
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 4. Atomic Chat AI Action Item RPC
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.rpc_process_chat_ai_action_item(
  p_event_id TEXT,
  p_room_id UUID,
  p_sender_id UUID,
  p_content TEXT,
  p_task_title TEXT,
  p_assignee_id UUID DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_task_id UUID;
  v_message_id UUID;
  v_room RECORD;
  v_claim_res JSONB;
BEGIN
  -- 1. Claim idempotency key atomically
  v_claim_res := public.rpc_record_inbound_webhook_event(
    'chat-ai-orchestrator',
    p_event_id,
    'chat_message_action_item',
    jsonb_build_object('room_id', p_room_id, 'sender_id', p_sender_id),
    NULL,
    p_tenant_id
  );

  IF (v_claim_res->>'is_duplicate')::boolean THEN
    RETURN jsonb_build_object(
      'success', true,
      'is_duplicate', true,
      'message', 'Action item already processed'
    );
  END IF;

  -- 2. Resolve room entity if not provided
  SELECT entity_type, entity_id, tenant_id
  INTO v_room
  FROM public.chat_rooms
  WHERE id = p_room_id;

  -- 3. Create Task
  INSERT INTO public.tasks (
    title,
    description,
    status,
    priority,
    assignee_id,
    order_id,
    work_order_id,
    tenant_id,
    created_at
  ) VALUES (
    p_task_title,
    'Nội dung: ' || p_content || E'\nPhòng chat: ' || p_room_id::text,
    'todo',
    'medium',
    p_assignee_id,
    CASE WHEN coalesce(p_entity_type, v_room.entity_type) = 'order' THEN coalesce(p_entity_id, v_room.entity_id::uuid) ELSE NULL END,
    CASE WHEN coalesce(p_entity_type, v_room.entity_type) = 'work_order' THEN coalesce(p_entity_id, v_room.entity_id::uuid) ELSE NULL END,
    coalesce(p_tenant_id, v_room.tenant_id),
    clock_timestamp()
  )
  RETURNING id INTO v_task_id;

  -- 4. Create confirmation message in chat
  INSERT INTO public.chat_messages (
    room_id,
    sender_id,
    content,
    message_type,
    metadata,
    tenant_id,
    created_at
  ) VALUES (
    p_room_id,
    NULL, -- System/bot message
    'Đã tự động tạo công việc từ tin nhắn: ' || p_task_title,
    'system',
    jsonb_build_object('task_id', v_task_id, 'source_event_id', p_event_id),
    coalesce(p_tenant_id, v_room.tenant_id),
    clock_timestamp()
  )
  RETURNING id INTO v_message_id;

  -- 5. Mark idempotency record as processed
  PERFORM public.rpc_complete_inbound_webhook_event(
    'chat-ai-orchestrator',
    p_event_id,
    'processed',
    NULL
  );

  RETURN jsonb_build_object(
    'success', true,
    'is_duplicate', false,
    'task_id', v_task_id,
    'message_id', v_message_id
  );
EXCEPTION WHEN OTHERS THEN
  PERFORM public.rpc_complete_inbound_webhook_event(
    'chat-ai-orchestrator',
    p_event_id,
    'failed',
    SQLERRM
  );
  RAISE;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 5. Sanitize Triggers: Remove Insecure Hardcoded Keys
-- ─────────────────────────────────────────────────────────────

-- 5.1 Harden Order Progress Notification Trigger (Remove hardcoded service_role JWT)
CREATE OR REPLACE FUNCTION public.trg_fn_order_progress_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_stage_name TEXT;
  v_stage_desc TEXT;
  v_order RECORD;
  v_customer_user RECORD;
  v_notif_id UUID;
  v_edge_fn_url TEXT;
  v_service_key TEXT;
  v_payload JSONB;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT * INTO v_order FROM public.orders WHERE id = NEW.order_id;
    IF NOT FOUND THEN
      RETURN NEW;
    END IF;

    CASE NEW.stage
      WHEN 'weaving' THEN
        v_stage_name := 'Dệt vải';
        v_stage_desc := 'Đang thực hiện công đoạn dệt';
      WHEN 'dyeing' THEN
        v_stage_name := 'Nhuộm màu';
        v_stage_desc := 'Đang thực hiện công đoạn nhuộm hoàn tất';
      WHEN 'finishing' THEN
        v_stage_name := 'Hoàn tất & Kiểm tra';
        v_stage_desc := 'Đang kiểm tra chất lượng và cuộn vải';
      WHEN 'ready_to_ship' THEN
        v_stage_name := 'Sẵn sàng giao hàng';
        v_stage_desc := 'Đơn hàng đã sẵn sàng xuất kho';
      ELSE
        v_stage_name := NEW.stage;
        v_stage_desc := 'Cập nhật tiến độ: ' || NEW.status;
    END CASE;

    FOR v_customer_user IN
      SELECT p.id, p.full_name
      FROM public.profiles p
      JOIN public.customers c ON c.id = v_order.customer_id
      WHERE p.tenant_id = v_order.tenant_id
        AND p.role IN ('customer', 'customer_user')
    LOOP
      v_notif_id := gen_random_uuid();

      INSERT INTO public.notifications (
        id,
        user_id,
        title,
        body,
        type,
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
        clock_timestamp()
      );

      -- Secure dispatch without hardcoded credentials
      BEGIN
        v_edge_fn_url := nullif(current_setting('app.settings.edge_function_url', true), '');
        v_service_key := coalesce(
          nullif(current_setting('app.settings.edge_function_service_role_key', true), ''),
          nullif(current_setting('app.settings.edge_function_anon_key', true), '')
        );

        IF v_edge_fn_url IS NOT NULL AND v_service_key IS NOT NULL THEN
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
        ELSE
          RAISE WARNING '[trg_fn_order_progress_notification] Edge function configuration missing, skipping web push dispatch';
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '[trg_fn_order_progress_notification] Push notification dispatch failed: %', SQLERRM;
      END;

    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- 5.2 Harden Chat Message Trigger (Remove hardcoded anon JWT and project URL)
CREATE OR REPLACE FUNCTION public.trg_fn_chat_message_inserted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_room RECORD;
  v_recipients UUID[];
  v_payload JSONB;
  v_push_url TEXT;
  v_anon_key TEXT;
  v_sender_name TEXT;
BEGIN
  IF NEW.message_type = 'system' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_room FROM public.chat_rooms WHERE id = NEW.room_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT coalesce(full_name, 'Thành viên')
  INTO v_sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  SELECT array_agg(user_id)
  INTO v_recipients
  FROM public.chat_room_participants
  WHERE room_id = NEW.room_id
    AND user_id <> NEW.sender_id;

  IF v_recipients IS NOT NULL AND array_length(v_recipients, 1) > 0 THEN
    v_payload := jsonb_build_object(
      'type', 'CHAT_MESSAGE',
      'message_id', NEW.id,
      'room_id', NEW.room_id,
      'sender_id', NEW.sender_id,
      'sender_name', coalesce(v_sender_name, 'Thành viên'),
      'room_title', coalesce(v_room.title, 'Trò chuyện'),
      'content', CASE
        WHEN NEW.message_type = 'image' THEN 'Đã gửi một hình ảnh'
        WHEN NEW.message_type = 'file' THEN 'Đã gửi một tệp đính kèm'
        ELSE LEFT(NEW.content, 200)
      END,
      'entity_type', v_room.entity_type,
      'entity_id', v_room.entity_id,
      'recipients', to_jsonb(v_recipients)
    );

    v_push_url := nullif(current_setting('app.settings.edge_function_url', true), '');
    v_anon_key := nullif(current_setting('app.settings.edge_function_anon_key', true), '');

    IF v_push_url IS NOT NULL AND v_anon_key IS NOT NULL THEN
      BEGIN
        PERFORM net.http_post(
          url := v_push_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_anon_key
          ),
          body := v_payload
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '[trg_fn_chat_message_inserted] Push notice: %', SQLERRM;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5.3 Harden Logistics Outbox Trigger (Remove hardcoded anon JWT and project URL)
CREATE OR REPLACE FUNCTION public.trg_fn_logistics_outbox_dispatched()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_push_url TEXT;
  v_anon_key TEXT;
BEGIN
  v_push_url := nullif(current_setting('app.settings.edge_function_url', true), '');
  v_anon_key := nullif(current_setting('app.settings.edge_function_anon_key', true), '');

  IF v_push_url IS NOT NULL AND v_anon_key IS NOT NULL THEN
    BEGIN
      PERFORM net.http_post(
        url := v_push_url,
        body := jsonb_build_object(
          'type', 'LOGISTICS_EVENT',
          'event_id', NEW.id,
          'event_type', NEW.event_type,
          'aggregate_id', NEW.aggregate_id,
          'payload', NEW.payload
        ),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_anon_key
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[trg_fn_logistics_outbox_dispatched] Web push dispatch notice: %', SQLERRM;
    END;
  END IF;

  NEW.status := 'dispatched';
  NEW.dispatched_at := NOW();

  RETURN NEW;
END;
$$;

-- 5.4 Harden Chat AI Orchestrator Trigger (Include event_id & timestamp)
CREATE OR REPLACE FUNCTION public.trigger_chat_ai_orchestrator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_url TEXT;
  v_key TEXT;
BEGIN
  IF NEW.message_type = 'system' THEN
    RETURN NEW;
  END IF;

  v_url := nullif(current_setting('app.settings.chat_ai_function_url', true), '');
  v_key := coalesce(
    nullif(current_setting('app.settings.edge_function_service_role_key', true), ''),
    nullif(current_setting('app.settings.edge_function_anon_key', true), '')
  );

  IF v_url IS NOT NULL THEN
    BEGIN
      PERFORM net.http_post(
        url := v_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || coalesce(v_key, ''),
          'x-webhook-id', NEW.id::text,
          'x-webhook-timestamp', extract(epoch from clock_timestamp())::bigint::text
        ),
        body := jsonb_build_object(
          'event_id', NEW.id::text,
          'timestamp', extract(epoch from clock_timestamp())::bigint,
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'schema', TG_TABLE_SCHEMA,
          'record', row_to_json(NEW)
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[trigger_chat_ai_orchestrator] Dispatch notice: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;
