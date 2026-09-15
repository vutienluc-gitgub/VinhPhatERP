-- ==============================================================================
-- Migration: 20260915000003_notification_outbox_p2_optimization.sql
-- Description: P2 Notification Outbox Optimization:
--              1. Reduces background fallback Grace Period from 60s to 15s for lower latency.
--              2. Reduces stale processing Lease Recovery threshold from 5m to 2m for faster crash recovery.
--              3. Reduces webhook in-flight execution threshold from 5m to 2m.
--              4. Implements automated daily retention purge for pg_net HTTP response table.
-- ==============================================================================

-- 1. Optimized Outbox Processor Function (15s Grace Period & 2m Lease Recovery)
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
  v_body JSONB;
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
      -- 1. Pending rows that passed the 15s direct delivery grace period (optimized from 60s)
      (o.status = 'pending' AND o.created_at <= clock_timestamp() - INTERVAL '15 seconds')
      -- 2. Failed rows ready for exponential backoff retry
      OR (o.status = 'failed' AND o.next_retry_at <= clock_timestamp())
      -- 3. Stale processing rows abandoned by crashed workers (> 2 minutes, optimized from 5m)
      OR (o.status = 'processing' AND o.locked_at <= clock_timestamp() - INTERVAL '2 minutes')
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

    -- Inject outbox_id into payload body for Edge Function callback correlation
    v_body := jsonb_set(
      COALESCE(v_row.payload, '{}'::jsonb),
      '{outbox_id}',
      to_jsonb(v_row.id::text)
    );

    BEGIN
      PERFORM net.http_post(
        url := v_push_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_anon_key
        ),
        body := v_body,
        timeout_milliseconds := 15000
      );

      outbox_id := v_row.id;
      event_type := v_row.event_type;
      status := 'processing';
      attempts := v_row.attempts;
      RETURN NEXT;

    EXCEPTION WHEN OTHERS THEN
      IF v_row.attempts + 1 >= v_row.max_attempts THEN
        UPDATE public.notification_outbox
        SET status = 'exhausted',
            attempts = notification_outbox.attempts + 1,
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
            attempts = notification_outbox.attempts + 1,
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

REVOKE EXECUTE ON FUNCTION public.fn_process_notification_outbox(INT) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_process_notification_outbox(INT) TO service_role;

-- 2. Optimized Webhook Idempotency RPC (2m In-flight Threshold)
CREATE OR REPLACE FUNCTION public.rpc_record_inbound_webhook_event(
  p_source TEXT,
  p_event_id TEXT,
  p_event_type TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_request_id TEXT DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL,
  p_subscription_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing RECORD;
  v_new_id UUID;
  v_effective_event_id TEXT;
BEGIN
  v_effective_event_id := CASE
    WHEN p_subscription_id IS NOT NULL THEN p_event_id || ':' || p_subscription_id::text
    ELSE p_event_id
  END;

  -- 1. Check existing record
  SELECT id, status, attempt_count, received_at
  INTO v_existing
  FROM public.inbound_webhook_events
  WHERE source = p_source AND event_id = v_effective_event_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.status = 'processed' THEN
      RETURN jsonb_build_object(
        'status', 'duplicate',
        'is_duplicate', true,
        'message', 'Event has already been processed',
        'event_id', v_effective_event_id,
        'record_id', v_existing.id
      );
    ELSIF v_existing.status = 'processing' AND v_existing.received_at > clock_timestamp() - INTERVAL '2 minutes' THEN
      RETURN jsonb_build_object(
        'status', 'in_flight',
        'is_duplicate', true,
        'message', 'Event is currently being processed by another worker',
        'event_id', v_effective_event_id,
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
        'event_id', v_effective_event_id,
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
    v_effective_event_id,
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
      'event_id', v_effective_event_id
    );
  END IF;

  RETURN jsonb_build_object(
    'status', 'accepted',
    'is_duplicate', false,
    'event_id', v_effective_event_id,
    'record_id', v_new_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_record_inbound_webhook_event(TEXT, TEXT, TEXT, JSONB, TEXT, UUID, UUID) TO service_role, authenticated;

-- 3. Automated Retention Purge for pg_net HTTP Responses
CREATE OR REPLACE FUNCTION public.fn_purge_pg_net_responses(
  p_retention_days INT DEFAULT 3
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, pg_temp
AS $$
DECLARE
  v_deleted INT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'net' AND tablename = '_http_response') THEN
    DELETE FROM net._http_response
    WHERE created < clock_timestamp() - (p_retention_days || ' days')::INTERVAL;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
  ELSE
    v_deleted := 0;
  END IF;
  RETURN v_deleted;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_purge_pg_net_responses(INT) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_purge_pg_net_responses(INT) TO service_role;

-- 4. Register Daily cron job for pg_net HTTP response purge at 03:30 UTC
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'pg-net-response-purge') THEN
    PERFORM cron.unschedule('pg-net-response-purge');
  END IF;

  PERFORM cron.schedule(
    'pg-net-response-purge',
    '30 3 * * *',
    'SELECT public.fn_purge_pg_net_responses(3);'
  );
END;
$$;
