-- ============================================================
-- Migration: 20260912000003_webhook_reliability_p1.sql
-- Description: P1 Webhook Reliability:
--   1. Add next_retry_at, max_attempts, retry_metadata to inbound_webhook_events
--   2. Add partial index for retry worker queries
--   3. Create rpc_schedule_inbound_webhook_retry function
-- ============================================================

-- 1. Alter Table: Add Retry Engine Tracking Columns
ALTER TABLE public.inbound_webhook_events
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_attempts INT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS retry_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Partial Index for Efficient Due-Event Polling
CREATE INDEX IF NOT EXISTS idx_inbound_webhook_events_retry
  ON public.inbound_webhook_events(status, next_retry_at)
  WHERE status = 'retry';

-- 3. Atomic Retry Scheduling RPC
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

  IF v_rec.attempt_count >= v_rec.max_attempts THEN
    UPDATE public.inbound_webhook_events
    SET status = 'failed',
        last_error = p_error,
        processed_at = clock_timestamp()
    WHERE id = v_rec.id;

    RETURN jsonb_build_object(
      'success', true,
      'status', 'failed',
      'attempt_count', v_rec.attempt_count,
      'reason', 'Max retry attempts exhausted'
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
