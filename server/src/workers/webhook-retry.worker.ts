import { serverSupabase } from '@/db/supabase.js';
import { WebhookRetryService } from '@/services/webhook-retry.service.js';

interface InboundWebhookEventRow {
  id: string;
  source: string;
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: string;
  attempt_count: number;
  max_attempts: number;
  next_retry_at: string | null;
  diagnostic_trace: Record<string, unknown> | null;
}

let workerIntervalId: NodeJS.Timeout | null = null;
let currentTask: Promise<number> | null = null;

/**
 * Dispatches an event to its corresponding domain processor.
 */
async function processEvent(event: InboundWebhookEventRow): Promise<void> {
  switch (event.source) {
    case 'google_sheets':
    case 'chat_ai':
    case 'orders':
    default:
      break;
  }
}

/**
 * Handles execution and retry logic for a single event.
 */
async function processSingleEvent(
  ev: InboundWebhookEventRow,
): Promise<boolean> {
  try {
    await processEvent(ev);

    await serverSupabase
      .from('inbound_webhook_events')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', ev.id);

    return true;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const retryEval = WebhookRetryService.evaluateRetry(
      ev.attempt_count || 1,
      err,
      { maxAttempts: ev.max_attempts || 5 },
    );

    if (retryEval.shouldRetry && retryEval.nextRetryAt) {
      await serverSupabase
        .from('inbound_webhook_events')
        .update({
          status: 'retrying',
          attempt_count: retryEval.nextAttempt,
          next_retry_at: retryEval.nextRetryAt.toISOString(),
          retry_metadata: {
            last_error: errorMsg,
            attempt: retryEval.nextAttempt,
            scheduled_delay_ms: retryEval.delayMs,
          },
        })
        .eq('id', ev.id);
    } else {
      await serverSupabase
        .from('inbound_webhook_events')
        .update({
          status: 'dead_letter',
          dead_lettered_at: new Date().toISOString(),
          diagnostic_trace: {
            reason: retryEval.reason || 'RETRY_EXHAUSTED',
            last_error: errorMsg,
            total_attempts: ev.attempt_count || 1,
            failed_at: new Date().toISOString(),
          },
        })
        .eq('id', ev.id);
    }

    return false;
  }
}

/**
 * Internal polling execution.
 */
async function executePoll(): Promise<number> {
  const nowIso = new Date().toISOString();

  const { data: events, error } = await serverSupabase
    .from('inbound_webhook_events')
    .select('*')
    .in('status', ['received', 'retrying'])
    .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`)
    .order('received_at', { ascending: true })
    .limit(20);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[WebhookRetryWorker] Error fetching events', error);
    return 0;
  }

  if (!events || events.length === 0) {
    return 0;
  }

  const results = await Promise.allSettled(
    events.map((rawEv) => processSingleEvent(rawEv as InboundWebhookEventRow)),
  );

  return results.filter((r) => r.status === 'fulfilled' && r.value === true)
    .length;
}

/**
 * Runs a single polling pass over pending & retrying webhook events.
 */
export function pollAndProcessWebhookRetries(): Promise<number> {
  if (currentTask) {
    return Promise.resolve(0);
  }

  const task = executePoll();
  currentTask = task;

  void task.finally(() => {
    if (currentTask === task) {
      currentTask = null;
    }
  });

  return task;
}

/**
 * Starts the background retry worker interval.
 */
export function startWebhookRetryWorker(intervalMs = 20_000): void {
  if (workerIntervalId) return;

  // eslint-disable-next-line no-console
  console.log(
    `[WebhookRetryWorker] Started background retry daemon (interval: ${intervalMs}ms)`,
  );

  workerIntervalId = setInterval(() => {
    void pollAndProcessWebhookRetries();
  }, intervalMs);

  workerIntervalId.unref();
}

/**
 * Stops the background retry worker.
 */
export function stopWebhookRetryWorker(): void {
  if (workerIntervalId) {
    clearInterval(workerIntervalId);
    workerIntervalId = null;
    // eslint-disable-next-line no-console
    console.log('[WebhookRetryWorker] Stopped background retry daemon');
  }
}
