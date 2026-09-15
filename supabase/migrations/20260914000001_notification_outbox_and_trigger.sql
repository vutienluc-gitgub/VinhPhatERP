-- ==============================================================================
-- Migration: 20260914000001_notification_outbox_and_trigger.sql
-- Description: Hardens Web Push Trigger with Transactional Outbox, 15000ms Timeout,
--              and Strict Compliance with INVARIANT-01 to INVARIANT-06.
-- ==============================================================================

-- 1. Create Transactional Outbox Table
CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'delivered', 'failed', 'exhausted')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for queue polling and retries
CREATE INDEX IF NOT EXISTS idx_notification_outbox_status_retry 
ON public.notification_outbox (status, next_retry_at) 
WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_notification_outbox_created_at
ON public.notification_outbox (created_at DESC);

-- Enable RLS
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

-- Service role & authenticated read policy
DROP POLICY IF EXISTS "Service role manages notification_outbox" ON public.notification_outbox;
CREATE POLICY "Service role manages notification_outbox" 
ON public.notification_outbox 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 2. Atomic Function to Enqueue Notification Outbox
CREATE OR REPLACE FUNCTION public.fn_enqueue_notification_outbox(
  p_event_type TEXT,
  p_payload JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notification_outbox (
    event_type,
    payload,
    status,
    attempts,
    next_retry_at
  ) VALUES (
    p_event_type,
    p_payload,
    'pending',
    0,
    now()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_enqueue_notification_outbox(TEXT, JSONB) TO authenticated, service_role;

-- 3. Hardened Chat Push Trigger Function
-- Ensures INVARIANT-01 & INVARIANT-02: Message persistence NEVER fails or rollbacks on push error.
CREATE OR REPLACE FUNCTION public.trg_fn_chat_message_inserted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_recipients UUID[];
  v_sender_name TEXT;
  v_room RECORD;
  v_payload JSONB;
  v_push_url TEXT;
  v_anon_key TEXT;
  v_outbox_id UUID;
BEGIN
  -- Defensive guard against recursive or system messages
  IF NEW.message_type = 'system' THEN
    RETURN NEW;
  END IF;

  -- 1. Increment unread count ONLY for explicit participants (excluding sender)
  IF NEW.sender_id IS NOT NULL THEN
    UPDATE public.chat_room_participants
    SET unread_count = unread_count + 1
    WHERE room_id = NEW.room_id
      AND user_id <> NEW.sender_id;
  END IF;

  -- 2. Resolve final notification recipients via decoupled policy resolver
  BEGIN
    v_recipients := public.fn_resolve_chat_notification_recipients(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[trg_fn_chat_message_inserted] Recipient resolution notice: %', SQLERRM;
    v_recipients := NULL;
  END;

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
      'type', 'CHAT_MESSAGE',
      'message_id', NEW.id,
      'room_id', NEW.room_id,
      'sender_id', NEW.sender_id,
      'sender_name', COALESCE(v_sender_name, 'Hệ thống'),
      'room_title', 'Trò chuyện',
      'content', CASE 
        WHEN NEW.message_type = 'image' THEN 'Đã gửi một hình ảnh'
        WHEN NEW.message_type = 'file' THEN 'Đã gửi một tệp đính kèm'
        ELSE LEFT(NEW.content, 200)
      END,
      'entity_type', v_room.entity_type,
      'entity_id', v_room.entity_id,
      'recipients', to_jsonb(v_recipients)
    );

    -- 3. Persist to Transactional Outbox for Guaranteed Durability
    BEGIN
      v_outbox_id := public.fn_enqueue_notification_outbox('CHAT_MESSAGE', v_payload);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[trg_fn_chat_message_inserted] Outbox enqueue notice: %', SQLERRM;
    END;

    -- 4. Fast Asynchronous HTTP Push Dispatch via net.http_post
    v_push_url := coalesce(
      nullif(current_setting('app.settings.edge_function_url', true), ''),
      'https://sxphijrofljxkccdwtub.supabase.co/functions/v1/send-web-push'
    );

    v_anon_key := coalesce(
      nullif(current_setting('app.settings.edge_function_anon_key', true), ''),
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDk1NTksImV4cCI6MjA5MDA4NTU1OX0.8e-qbhqv6UgCZ46Yx7sa9FWGCdT50q27i4kAiMtCpxc'
    );

    BEGIN
      PERFORM net.http_post(
        url := v_push_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_anon_key
        ),
        body := v_payload,
        timeout_milliseconds := 15000
      );
    EXCEPTION WHEN OTHERS THEN
      -- INVARIANT-02: Never rollback chat message transaction on network or push failure
      RAISE WARNING '[trg_fn_chat_message_inserted] HTTP push dispatch notice: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Durable Outbox Processor RPC
CREATE OR REPLACE FUNCTION public.fn_process_notification_outbox(
  p_batch_size INT DEFAULT 10
)
RETURNS TABLE (
  outbox_id UUID,
  event_type TEXT,
  status TEXT,
  attempts INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row RECORD;
  v_push_url TEXT;
  v_anon_key TEXT;
BEGIN
  v_push_url := coalesce(
    nullif(current_setting('app.settings.edge_function_url', true), ''),
    'https://sxphijrofljxkccdwtub.supabase.co/functions/v1/send-web-push'
  );

  v_anon_key := coalesce(
    nullif(current_setting('app.settings.edge_function_anon_key', true), ''),
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDk1NTksImV4cCI6MjA5MDA4NTU1OX0.8e-qbhqv6UgCZ46Yx7sa9FWGCdT50q27i4kAiMtCpxc'
  );

  FOR v_row IN
    SELECT o.id, o.event_type, o.payload, o.attempts, o.max_attempts
    FROM public.notification_outbox o
    WHERE o.status IN ('pending', 'failed')
      AND o.next_retry_at <= now()
    ORDER BY o.next_retry_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      PERFORM net.http_post(
        url := v_push_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_anon_key
        ),
        body := v_row.payload,
        timeout_milliseconds := 15000
      );

      UPDATE public.notification_outbox
      SET status = 'processing',
          attempts = attempts + 1,
          updated_at = now()
      WHERE id = v_row.id;

      outbox_id := v_row.id;
      event_type := v_row.event_type;
      status := 'processing';
      attempts := v_row.attempts + 1;
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      IF v_row.attempts + 1 >= v_row.max_attempts THEN
        UPDATE public.notification_outbox
        SET status = 'exhausted',
            attempts = attempts + 1,
            last_error = SQLERRM,
            updated_at = now()
        WHERE id = v_row.id;
      ELSE
        UPDATE public.notification_outbox
        SET status = 'failed',
            attempts = attempts + 1,
            next_retry_at = now() + (power(2, v_row.attempts + 1) * interval '10 seconds'),
            last_error = SQLERRM,
            updated_at = now()
        WHERE id = v_row.id;
      END IF;

      outbox_id := v_row.id;
      event_type := v_row.event_type;
      status := 'failed';
      attempts := v_row.attempts + 1;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_process_notification_outbox(INT) TO authenticated, service_role;
