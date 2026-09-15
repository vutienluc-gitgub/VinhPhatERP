-- ==============================================================================
-- Migration: 20260915000004_notification_outbox_p3_observability.sql
-- Description: P3 Notification Delivery Observability Enhancements:
--              1. Adds subscription_id and latency_ms to notification_delivery_logs for granular device tracking.
--              2. Creates v_notification_delivery_stats for real-time delivery health monitoring.
--              3. Creates v_push_subscription_health for multi-device subscription monitoring.
-- ==============================================================================

-- 1. Enhance notification_delivery_logs with subscription_id & latency_ms
ALTER TABLE public.notification_delivery_logs
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.push_subscriptions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS latency_ms INT;

CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_sub
  ON public.notification_delivery_logs(subscription_id)
  WHERE subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_created_at
  ON public.notification_delivery_logs(created_at DESC);

-- 2. Delivery Stats View for Health Monitoring
CREATE OR REPLACE VIEW public.v_notification_delivery_stats AS
SELECT
  channel,
  status,
  COUNT(*) AS total_count,
  AVG(latency_ms)::INT AS avg_latency_ms,
  MAX(latency_ms) AS max_latency_ms,
  DATE_TRUNC('day', created_at) AS delivery_date
FROM public.notification_delivery_logs
GROUP BY channel, status, DATE_TRUNC('day', created_at);

-- 3. Push Subscription Health View
CREATE OR REPLACE VIEW public.v_push_subscription_health AS
SELECT
  platform,
  browser,
  COUNT(*) FILTER (WHERE revoked_at IS NULL) AS active_subscriptions,
  COUNT(*) FILTER (WHERE revoked_at IS NOT NULL) AS revoked_subscriptions,
  MAX(last_seen_at) AS latest_activity
FROM public.push_subscriptions
GROUP BY platform, browser;
