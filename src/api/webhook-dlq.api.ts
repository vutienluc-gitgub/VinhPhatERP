import { untypedDb } from '@/services/supabase/untyped';
import { logger } from '@/shared/utils/logger';

export interface WebhookSourceMetrics {
  source: string;
  total: number;
  processed: number;
  dead_letter: number;
}

export interface WebhookMetricsSummary {
  time_window_hours: number;
  total_events: number;
  processed_events: number;
  retry_events: number;
  failed_events: number;
  dead_letter_events: number;
  success_rate_percentage: number;
  sources: WebhookSourceMetrics[];
}

export interface DeadLetterEvent {
  id: string;
  source: string;
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: string;
  attempt_count: number;
  max_attempts: number;
  last_error: string | null;
  diagnostic_trace: Record<string, unknown>;
  received_at: string;
  dead_lettered_at: string | null;
}

export const webhookDlqApi = {
  /**
   * Fetches real-time aggregated metrics for webhooks over a time window.
   */
  async getMetrics(windowHours = 24): Promise<WebhookMetricsSummary> {
    const { data, error } = await untypedDb.rpc('rpc_get_webhook_metrics', {
      p_time_window_hours: windowHours,
    });

    if (error) {
      logger.error('[webhookDlqApi.getMetrics] Failed to fetch metrics', {
        error,
      });
      throw new Error(`Failed to fetch webhook metrics: ${error.message}`);
    }

    return (
      (data as WebhookMetricsSummary) ?? {
        time_window_hours: windowHours,
        total_events: 0,
        processed_events: 0,
        retry_events: 0,
        failed_events: 0,
        dead_letter_events: 0,
        success_rate_percentage: 100.0,
        sources: [],
      }
    );
  },

  /**
   * Fetches the list of dead-lettered webhook events.
   */
  async getDeadLetterEvents(
    limit = 50,
    offset = 0,
  ): Promise<DeadLetterEvent[]> {
    const { data, error } = await untypedDb.rpc('rpc_get_dead_letter_events', {
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      logger.error(
        '[webhookDlqApi.getDeadLetterEvents] Failed to fetch events',
        {
          error,
        },
      );
      throw new Error(`Failed to fetch dead letter events: ${error.message}`);
    }

    return (data as DeadLetterEvent[]) ?? [];
  },

  /**
   * Replays a single dead letter event back into 'received' queue.
   */
  async replaySingleEvent(
    eventId: string,
    source: string,
  ): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await untypedDb.rpc(
      'rpc_replay_dead_letter_event',
      {
        p_event_id: eventId,
        p_source: source,
      },
    );

    if (error) {
      logger.error('[webhookDlqApi.replaySingleEvent] Replay RPC error', {
        error,
        eventId,
        source,
      });
      throw new Error(`Failed to replay event: ${error.message}`);
    }

    return (data as { success: boolean; error?: string }) ?? { success: false };
  },

  /**
   * Replays all dead letter events across all sources or filtered by source.
   */
  async replayAllEvents(
    source?: string,
  ): Promise<{ success: boolean; replayed_count: number }> {
    const { data, error } = await untypedDb.rpc(
      'rpc_replay_all_dead_letter_events',
      {
        p_source: source ?? null,
      },
    );

    if (error) {
      logger.error('[webhookDlqApi.replayAllEvents] Batch replay RPC error', {
        error,
        source,
      });
      throw new Error(`Failed to replay all events: ${error.message}`);
    }

    return (
      (data as { success: boolean; replayed_count: number }) ?? {
        success: false,
        replayed_count: 0,
      }
    );
  },
};
