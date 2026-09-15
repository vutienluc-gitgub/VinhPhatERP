-- ==============================================================================
-- Migration: 20260915000001_notification_outbox_reliability.sql
-- Description: Hardens Notification Outbox processing pipeline:
--              1. Enables pg_cron extension
--              2. Adds locked_at and processed_at columns for crash recovery & observability
--              3. Refactors fn_process_notification_outbox with 60s grace period and lease recovery
--              4. Implements terminal delivered state and exponential backoff
--              5. Adds automated archival function fn_purge_notification_outbox
--              6. Schedules periodic cron jobs (30s processor, daily purge)
-- ==============================================================================

-- 1. Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Add columns for crash recovery and observability
ALTER TABLE public.notification_outbox
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Index for identifying stale processing locks
CREATE INDEX IF NOT EXISTS idx_notification_outbox_processing_stale
ON public.notification_outbox (status, locked_at)
WHERE status = 'processing';

-- 3. Hardened Outbox Processor with Lease Recovery & Grace Period
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
    WHERE (
      -- 1. Pending rows that passed the 60s direct delivery grace period
      (o.status = 'pending' AND o.created_at <= clock_timestamp() - INTERVAL '60 seconds')
      -- 2. Failed rows ready for exponential backoff retry
      OR (o.status = 'failed' AND o.next_retry_at <= clock_timestamp())
      -- 3. Stale processing rows abandoned by crashed workers (> 5 minutes)
      OR (o.status = 'processing' AND o.locked_at <= clock_timestamp() - INTERVAL '5 minutes')
    )
    ORDER BY o.created_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Atomically claim row with lease lock
    UPDATE public.notification_outbox
    SET status = 'processing',
        locked_at = clock_timestamp(),
        updated_at = clock_timestamp()
    WHERE id = v_row.id;

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

      -- Successfully enqueued to pg_net: transition to terminal delivered state
      UPDATE public.notification_outbox
      SET status = 'delivered',
          attempts = v_row.attempts + 1,
          processed_at = clock_timestamp(),
          locked_at = NULL,
          updated_at = clock_timestamp()
      WHERE notification_outbox.id = v_row.id;

      outbox_id := v_row.id;
      event_type := v_row.event_type;
      status := 'delivered';
      attempts := v_row.attempts + 1;
      RETURN NEXT;

    EXCEPTION WHEN OTHERS THEN
      IF v_row.attempts + 1 >= v_row.max_attempts THEN
        UPDATE public.notification_outbox
        SET status = 'exhausted',
            attempts = v_row.attempts + 1,
            last_error = SQLERRM,
            locked_at = NULL,
            updated_at = clock_timestamp()
        WHERE notification_outbox.id = v_row.id;

        outbox_id := v_row.id;
        event_type := v_row.event_type;
        status := 'exhausted';
        attempts := v_row.attempts + 1;
        RETURN NEXT;
      ELSE
        UPDATE public.notification_outbox
        SET status = 'failed',
            attempts = v_row.attempts + 1,
            next_retry_at = clock_timestamp() + (power(2, v_row.attempts + 1) * interval '10 seconds'),
            last_error = SQLERRM,
            locked_at = NULL,
            updated_at = clock_timestamp()
        WHERE notification_outbox.id = v_row.id;

        outbox_id := v_row.id;
        event_type := v_row.event_type;
        status := 'failed';
        attempts := v_row.attempts + 1;
        RETURN NEXT;
      END IF;
    END;
  END LOOP;
END;
$$;

-- Enforce strict backend execution authority (service_role only)
REVOKE EXECUTE ON FUNCTION public.fn_process_notification_outbox(INT) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_process_notification_outbox(INT) TO service_role;

-- 4. Automated Retention Purge Function
CREATE OR REPLACE FUNCTION public.fn_purge_notification_outbox(
  p_retention_days INT DEFAULT 7
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM public.notification_outbox
  WHERE status IN ('delivered', 'exhausted')
    AND created_at < clock_timestamp() - (p_retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_purge_notification_outbox(INT) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_purge_notification_outbox(INT) TO service_role;

-- 5. Periodic cron schedules (idempotent setup)
DO $$
BEGIN
  -- 5.1 Outbox processor: runs every 30 seconds
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notification-outbox-processor') THEN
    PERFORM cron.unschedule('notification-outbox-processor');
  END IF;

  PERFORM cron.schedule(
    'notification-outbox-processor',
    '30 seconds',
    'SELECT * FROM public.fn_process_notification_outbox(20);'
  );

  -- 5.2 Outbox retention purge: runs once daily at 03:00 UTC
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notification-outbox-purge') THEN
    PERFORM cron.unschedule('notification-outbox-purge');
  END IF;

  PERFORM cron.schedule(
    'notification-outbox-purge',
    '0 3 * * *',
    'SELECT public.fn_purge_notification_outbox(7);'
  );
END;
$$;
