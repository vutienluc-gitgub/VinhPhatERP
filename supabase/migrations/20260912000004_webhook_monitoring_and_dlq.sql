-- ============================================================
-- Migration: 20260912000004_webhook_monitoring_and_dlq.sql
-- Description: P2 Webhook Monitoring & Dead Letter Queue (DLQ):
--   1. Add dead_lettered_at and diagnostic_trace columns
--   2. Update rpc_schedule_inbound_webhook_retry to mark dead_letter on exhaustion
--   3. Create rpc_get_webhook_metrics for dashboard KPIs
--   4. Create rpc_get_dead_letter_events for DLQ table
--   5. Create rpc_replay_dead_letter_event & rpc_replay_all_dead_letter_events
-- ============================================================

-- 1. Alter Table: Add DLQ Tracking Columns
ALTER TABLE public.inbound_webhook_events
  ADD COLUMN IF NOT EXISTS dead_lettered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS diagnostic_trace JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Index for Dead Letter Queue Querying
CREATE INDEX IF NOT EXISTS idx_inbound_webhook_events_dlq
  ON public.inbound_webhook_events(status, dead_lettered_at)
  WHERE status IN ('dead_letter', 'failed');

-- 3. Upgrade Retry Scheduling RPC to transition to 'dead_letter' on exhaustion
CREATE OR REPLACE FUNCTION public.rpc_schedule_inbound_webhook_retry(
  p_source TEXT,
  p_event_id TEXT,
  p_error TEXT,
  p_delay_ms INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rec RECORD;
  v_next_retry TIMESTAMPTZ;
BEGIN
  SELECT id, attempt_count, max_attempts
  INTO v_rec
  FROM public.inbound_webhook_events
  WHERE source = p_source AND event_id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event record not found');
  END IF;

  -- If retry count reaches max, transition to dead_letter
  IF v_rec.attempt_count >= v_rec.max_attempts THEN
    UPDATE public.inbound_webhook_events
    SET status = 'dead_letter',
        last_error = p_error,
        dead_lettered_at = clock_timestamp(),
        diagnostic_trace = jsonb_build_object(
          'exhausted_at', clock_timestamp(),
          'final_attempt', v_rec.attempt_count,
          'error', p_error
        )
    WHERE id = v_rec.id;

    RETURN jsonb_build_object(
      'success', true,
      'status', 'dead_letter',
      'attempt_count', v_rec.attempt_count,
      'reason', 'Max retry attempts exhausted, transitioned to Dead Letter Queue'
    );
  ELSE
    v_next_retry := clock_timestamp() + (GREATEST(100, p_delay_ms) || ' milliseconds')::interval;

    UPDATE public.inbound_webhook_events
    SET status = 'retry',
        last_error = p_error,
        next_retry_at = v_next_retry,
        retry_metadata = jsonb_build_object(
          'last_failure_reason', p_error,
          'scheduled_delay_ms', p_delay_ms,
          'scheduled_at', clock_timestamp()
        )
    WHERE id = v_rec.id;

    RETURN jsonb_build_object(
      'success', true,
      'status', 'retry',
      'attempt_count', v_rec.attempt_count,
      'next_retry_at', v_next_retry
    );
  END IF;
END;
$$;

-- 4. Webhook Metrics Aggregation RPC
CREATE OR REPLACE FUNCTION public.rpc_get_webhook_metrics(
  p_time_window_hours INT DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_total INT := 0;
  v_processed INT := 0;
  v_retry INT := 0;
  v_failed INT := 0;
  v_dead_letter INT := 0;
  v_success_rate NUMERIC := 100.0;
  v_by_source JSONB := '[]'::jsonb;
BEGIN
  v_window_start := clock_timestamp() - (GREATEST(1, p_time_window_hours) || ' hours')::interval;

  SELECT
    count(*),
    count(*) FILTER (WHERE status = 'processed'),
    count(*) FILTER (WHERE status = 'retry'),
    count(*) FILTER (WHERE status = 'failed'),
    count(*) FILTER (WHERE status = 'dead_letter')
  INTO
    v_total,
    v_processed,
    v_retry,
    v_failed,
    v_dead_letter
  FROM public.inbound_webhook_events
  WHERE received_at >= v_window_start;

  IF v_total > 0 THEN
    v_success_rate := round(((v_processed::numeric / v_total::numeric) * 100), 1);
  END IF;

  SELECT coalesce(jsonb_agg(sub), '[]'::jsonb)
  INTO v_by_source
  FROM (
    SELECT
      source,
      count(*) as total,
      count(*) FILTER (WHERE status = 'processed') as processed,
      count(*) FILTER (WHERE status = 'dead_letter') as dead_letter
    FROM public.inbound_webhook_events
    WHERE received_at >= v_window_start
    GROUP BY source
    ORDER BY total DESC
  ) sub;

  RETURN jsonb_build_object(
    'time_window_hours', p_time_window_hours,
    'total_events', v_total,
    'processed_events', v_processed,
    'retry_events', v_retry,
    'failed_events', v_failed,
    'dead_letter_events', v_dead_letter,
    'success_rate_percentage', v_success_rate,
    'sources', v_by_source
  );
END;
$$;

-- 5. Dead Letter Events Retrieval RPC
CREATE OR REPLACE FUNCTION public.rpc_get_dead_letter_events(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT coalesce(jsonb_agg(sub), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      id,
      source,
      event_id,
      event_type,
      payload,
      status,
      attempt_count,
      max_attempts,
      last_error,
      diagnostic_trace,
      received_at,
      dead_lettered_at
    FROM public.inbound_webhook_events
    WHERE status IN ('dead_letter', 'failed')
    ORDER BY coalesce(dead_lettered_at, received_at) DESC
    LIMIT GREATEST(1, p_limit)
    OFFSET GREATEST(0, p_offset)
  ) sub;

  RETURN v_result;
END;
$$;

-- 6. Replay Single Dead Letter Event RPC
CREATE OR REPLACE FUNCTION public.rpc_replay_dead_letter_event(
  p_event_id TEXT,
  p_source TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
BEGIN
  UPDATE public.inbound_webhook_events
  SET status = 'received',
      attempt_count = 0,
      next_retry_at = clock_timestamp(),
      retry_metadata = jsonb_build_object(
        'replayed_at', clock_timestamp(),
        'replayed_by', auth.uid()
      )
  WHERE source = p_source AND event_id = p_event_id
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found in Dead Letter Queue');
  END IF;

  RETURN jsonb_build_object('success', true, 'event_id', p_event_id, 'record_id', v_id);
END;
$$;

-- 7. Batch Replay All Dead Letter Events RPC
CREATE OR REPLACE FUNCTION public.rpc_replay_all_dead_letter_events(
  p_source TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE public.inbound_webhook_events
  SET status = 'received',
      attempt_count = 0,
      next_retry_at = clock_timestamp(),
      retry_metadata = jsonb_build_object(
        'batch_replayed_at', clock_timestamp(),
        'replayed_by', auth.uid()
      )
  WHERE status IN ('dead_letter', 'failed')
    AND (p_source IS NULL OR source = p_source);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'replayed_count', v_count);
END;
$$;
