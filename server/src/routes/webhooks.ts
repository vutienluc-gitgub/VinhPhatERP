import { Hono } from 'hono';

import { serverSupabase } from '@/db/supabase.js';
import { WebhookSecurityService } from '@/services/webhook-security.service.js';

const webhooksRouter = new Hono();

/**
 * Inbound Webhook Endpoint
 * POST /api/v1/webhooks/inbound/:source
 */
webhooksRouter.post('/inbound/:source', async (c) => {
  const source = c.req.param('source');
  const signature = c.req.header('x-webhook-signature');
  const timestamp = c.req.header('x-webhook-timestamp');

  const rawBody = await c.req.text();

  // 1. Signature & Replay Verification
  const verification = WebhookSecurityService.verifyInboundRequest(
    rawBody,
    signature,
    timestamp,
  );

  if (!verification.success) {
    return c.json(
      {
        error: 'Forbidden: Webhook verification failed',
        details: verification.error,
      },
      403,
    );
  }

  let parsedPayload: Record<string, unknown>;
  try {
    parsedPayload = JSON.parse(rawBody);
  } catch {
    return c.json({ error: 'Bad Request: Invalid JSON body' }, 400);
  }

  // 2. Extract or generate event ID
  const eventId =
    (parsedPayload.event_id as string) ||
    (parsedPayload.id as string) ||
    (parsedPayload.message_id as string) ||
    `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const eventType =
    (parsedPayload.event_type as string) ||
    (parsedPayload.type as string) ||
    'event';

  // 3. Database-backed Idempotency Check & Registration
  const { data: recordRes, error: rpcError } = await serverSupabase.rpc(
    'rpc_record_inbound_webhook_event',
    {
      p_source: source,
      p_event_id: eventId,
      p_event_type: eventType,
      p_payload: parsedPayload,
    },
  );

  if (rpcError) {
    // eslint-disable-next-line no-console
    console.error('[WebhooksRouter] Error recording webhook event', rpcError);
    return c.json(
      { error: 'Internal Server Error', message: rpcError.message },
      500,
    );
  }

  if (recordRes?.is_duplicate) {
    return c.json(
      {
        status: 'skipped_duplicate',
        event_id: eventId,
        message: 'Event was already recorded and processed or queued',
      },
      200,
    );
  }

  return c.json(
    {
      status: 'accepted',
      event_id: eventId,
      source,
      message: 'Event received and queued for processing',
    },
    202,
  );
});

/**
 * Webhook Monitoring & DLQ Metrics Endpoint
 * GET /api/v1/webhooks/metrics
 */
webhooksRouter.get('/metrics', async (c) => {
  const hours = Number(c.req.query('hours') || '24');

  const { data, error } = await serverSupabase.rpc('rpc_get_webhook_metrics', {
    p_time_window_hours: hours,
  });

  if (error) {
    return c.json(
      { error: 'Failed to fetch metrics', message: error.message },
      500,
    );
  }

  return c.json(data);
});

/**
 * List Dead Letter Events
 * GET /api/v1/webhooks/dead-letter
 */
webhooksRouter.get('/dead-letter', async (c) => {
  const limit = Number(c.req.query('limit') || '50');
  const offset = Number(c.req.query('offset') || '0');

  const { data, error } = await serverSupabase.rpc(
    'rpc_get_dead_letter_events',
    {
      p_limit: limit,
      p_offset: offset,
    },
  );

  if (error) {
    return c.json(
      { error: 'Failed to fetch dead letter events', message: error.message },
      500,
    );
  }

  return c.json(data || []);
});

/**
 * Replay Single Dead Letter Event
 * POST /api/v1/webhooks/replay/:eventId
 */
webhooksRouter.post('/replay/:eventId', async (c) => {
  const eventId = c.req.param('eventId');
  const source = c.req.query('source') || '';

  const { data, error } = await serverSupabase.rpc(
    'rpc_replay_dead_letter_event',
    {
      p_event_id: eventId,
      p_source: source,
    },
  );

  if (error) {
    return c.json(
      { error: 'Failed to replay event', message: error.message },
      500,
    );
  }

  return c.json(data);
});

/**
 * Replay All Dead Letter Events
 * POST /api/v1/webhooks/replay-all
 */
webhooksRouter.post('/replay-all', async (c) => {
  const source = c.req.query('source') || null;

  const { data, error } = await serverSupabase.rpc(
    'rpc_replay_all_dead_letter_events',
    {
      p_source: source,
    },
  );

  if (error) {
    return c.json(
      { error: 'Failed to replay all events', message: error.message },
      500,
    );
  }

  return c.json(data);
});

export default webhooksRouter;
