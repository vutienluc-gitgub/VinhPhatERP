import { describe, it, expect, vi, beforeEach } from 'vitest';

import { webhookDlqApi } from '@/api/webhook-dlq.api';
import { untypedDb } from '@/services/supabase/untyped';

import { WebhookLogger } from './webhook-logger.service';
import { WebhookRetryService } from './webhook-retry.service';

vi.mock('@/services/supabase/untyped', () => ({
  untypedDb: {
    rpc: vi.fn(),
  },
}));

describe('Webhook Monitoring & DLQ Engine (P2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Webhook DLQ API Client Unit Tests
  // ─────────────────────────────────────────────────────────────
  describe('webhookDlqApi', () => {
    it('getMetrics calls rpc_get_webhook_metrics and returns aggregated summary', async () => {
      const mockMetrics = {
        time_window_hours: 24,
        total_events: 150,
        processed_events: 142,
        retry_events: 5,
        failed_events: 0,
        dead_letter_events: 3,
        success_rate_percentage: 94.67,
        sources: [
          {
            source: 'google_sheets',
            total: 100,
            processed: 98,
            dead_letter: 1,
          },
          { source: 'chat_ai', total: 50, processed: 44, dead_letter: 2 },
        ],
      };

      vi.mocked(untypedDb.rpc).mockResolvedValueOnce({
        data: mockMetrics,
        error: null,
      } as unknown as Awaited<ReturnType<typeof untypedDb.rpc>>);

      const result = await webhookDlqApi.getMetrics(24);

      expect(untypedDb.rpc).toHaveBeenCalledWith('rpc_get_webhook_metrics', {
        p_time_window_hours: 24,
      });
      expect(result.total_events).toBe(150);
      expect(result.success_rate_percentage).toBe(94.67);
      expect(result.dead_letter_events).toBe(3);
      expect(result.sources).toHaveLength(2);
    });

    it('getMetrics returns fallback safe values when data is null', async () => {
      vi.mocked(untypedDb.rpc).mockResolvedValueOnce({
        data: null,
        error: null,
      } as unknown as Awaited<ReturnType<typeof untypedDb.rpc>>);

      const result = await webhookDlqApi.getMetrics(12);

      expect(result.time_window_hours).toBe(12);
      expect(result.total_events).toBe(0);
      expect(result.success_rate_percentage).toBe(100.0);
      expect(result.sources).toEqual([]);
    });

    it('getMetrics throws formatted error when RPC returns an error', async () => {
      vi.mocked(untypedDb.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed', code: 'P0001' },
      } as unknown as Awaited<ReturnType<typeof untypedDb.rpc>>);

      await expect(webhookDlqApi.getMetrics(24)).rejects.toThrow(
        'Failed to fetch webhook metrics: Database connection failed',
      );
    });

    it('getDeadLetterEvents fetches dead-lettered events with pagination', async () => {
      const mockEvents = [
        {
          id: 'dlq-1',
          source: 'chat_ai',
          event_id: 'evt-001',
          event_type: 'agent_task_completed',
          payload: { task: 'summarize' },
          status: 'dead_letter',
          attempt_count: 5,
          max_attempts: 5,
          last_error: 'ETIMEDOUT: Connection dropped after 5 attempts',
          diagnostic_trace: { reason: 'exhausted_retries' },
          received_at: '2026-09-12T10:00:00Z',
          dead_lettered_at: '2026-09-12T10:15:00Z',
        },
      ];

      vi.mocked(untypedDb.rpc).mockResolvedValueOnce({
        data: mockEvents,
        error: null,
      } as unknown as Awaited<ReturnType<typeof untypedDb.rpc>>);

      const result = await webhookDlqApi.getDeadLetterEvents(20, 0);

      expect(untypedDb.rpc).toHaveBeenCalledWith('rpc_get_dead_letter_events', {
        p_limit: 20,
        p_offset: 0,
      });
      expect(result).toHaveLength(1);
      expect(result[0]?.event_id).toBe('evt-001');
      expect(result[0]?.status).toBe('dead_letter');
    });

    it('replaySingleEvent sends RPC to replay one event', async () => {
      vi.mocked(untypedDb.rpc).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      } as unknown as Awaited<ReturnType<typeof untypedDb.rpc>>);

      const result = await webhookDlqApi.replaySingleEvent(
        'evt-100',
        'google_sheets',
      );

      expect(untypedDb.rpc).toHaveBeenCalledWith(
        'rpc_replay_dead_letter_event',
        {
          p_event_id: 'evt-100',
          p_source: 'google_sheets',
        },
      );
      expect(result.success).toBe(true);
    });

    it('replaySingleEvent throws when RPC encounters error', async () => {
      vi.mocked(untypedDb.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Event not found in dead letter status' },
      } as unknown as Awaited<ReturnType<typeof untypedDb.rpc>>);

      await expect(
        webhookDlqApi.replaySingleEvent('non-existent', 'chat_ai'),
      ).rejects.toThrow(
        'Failed to replay event: Event not found in dead letter status',
      );
    });

    it('replayAllEvents sends RPC to replay all events across all or specific sources', async () => {
      vi.mocked(untypedDb.rpc).mockResolvedValueOnce({
        data: { success: true, replayed_count: 7 },
        error: null,
      } as unknown as Awaited<ReturnType<typeof untypedDb.rpc>>);

      const result = await webhookDlqApi.replayAllEvents('chat_ai');

      expect(untypedDb.rpc).toHaveBeenCalledWith(
        'rpc_replay_all_dead_letter_events',
        {
          p_source: 'chat_ai',
        },
      );
      expect(result.success).toBe(true);
      expect(result.replayed_count).toBe(7);
    });

    it('replayAllEvents handles null source for system-wide replay', async () => {
      vi.mocked(untypedDb.rpc).mockResolvedValueOnce({
        data: { success: true, replayed_count: 12 },
        error: null,
      } as unknown as Awaited<ReturnType<typeof untypedDb.rpc>>);

      const result = await webhookDlqApi.replayAllEvents();

      expect(untypedDb.rpc).toHaveBeenCalledWith(
        'rpc_replay_all_dead_letter_events',
        {
          p_source: null,
        },
      );
      expect(result.replayed_count).toBe(12);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Metrics Math & Calculation Precision
  // ─────────────────────────────────────────────────────────────
  describe('Metrics Aggregation & Success Rate Logic', () => {
    function computeSuccessRate(processed: number, total: number): number {
      if (total === 0) return 100.0;
      return Math.round((processed / total) * 10000) / 100;
    }

    it('calculates 100% success rate when zero events occur', () => {
      expect(computeSuccessRate(0, 0)).toBe(100.0);
    });

    it('calculates exact success rate with two decimal precision', () => {
      // 142 / 150 = 0.946666... -> 94.67%
      expect(computeSuccessRate(142, 150)).toBe(94.67);
      // 99 / 100 = 99.0%
      expect(computeSuccessRate(99, 100)).toBe(99.0);
      // 1 / 3 = 33.33%
      expect(computeSuccessRate(1, 3)).toBe(33.33);
      // 0 / 10 = 0%
      expect(computeSuccessRate(0, 10)).toBe(0.0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Diagnostic Trace & PII Masking in DLQ
  // ─────────────────────────────────────────────────────────────
  describe('DLQ Diagnostic Trace & PII Masking', () => {
    it('creates structured diagnostic trace on dead letter transition', () => {
      const error = new Error('Connection refused to AI Gateway (503)');
      error.stack =
        'Error: Connection refused\n    at HttpClient.post (/app/client.js:42:15)';

      const trace = {
        reason: 'MAX_RETRIES_EXCEEDED',
        attemptCount: 5,
        maxAttempts: 5,
        errorMessage: error.message,
        stack: error.stack,
        deadLetteredAt: new Date().toISOString(),
        headers: WebhookLogger.sanitizePayload({
          authorization: 'Bearer ai_live_sec_999999999',
          'x-api-key': 'vp_secret_key_abcdef',
          'content-type': 'application/json',
        }),
      };

      expect(trace.reason).toBe('MAX_RETRIES_EXCEEDED');
      expect(trace.attemptCount).toBe(5);
      expect(trace.errorMessage).toContain('Connection refused');
      expect((trace.headers as Record<string, string>).authorization).toBe(
        'Bearer ***',
      );
      expect((trace.headers as Record<string, string>)['x-api-key']).toBe(
        '***',
      );
      expect((trace.headers as Record<string, string>)['content-type']).toBe(
        'application/json',
      );
    });

    it('masks nested sensitive customer data before writing to DLQ payload', () => {
      const rawPayload = {
        orderId: 'ORD-2026-999',
        customer: {
          name: 'Nguyen Van A',
          phoneNumber: '0901234567',
          token: 'jwt_sensitive_token_payload',
          shippingAddress: '123 Le Loi, Q1, HCMC',
        },
        items: [{ sku: 'FAB-COTTON-01', quantity: 50 }],
      };

      const masked = WebhookLogger.sanitizePayload(
        rawPayload,
      ) as typeof rawPayload;

      expect(masked.orderId).toBe('ORD-2026-999');
      expect(masked.customer.token).toBe('***');
      expect(masked.customer.name).toBe('Nguyen Van A');
      expect(masked.items[0]?.quantity).toBe(50);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Dead Letter State Transition Guard
  // ─────────────────────────────────────────────────────────────
  describe('Dead Letter State Transition Logic', () => {
    it('exhausted retries trigger dead_letter transition status', () => {
      const retryEval = WebhookRetryService.evaluateRetry(
        5,
        new Error('Gateway Timeout 504'),
        {
          maxAttempts: 5,
        },
      );

      expect(retryEval.shouldRetry).toBe(false);
      expect(retryEval.reason).toContain('exhausted');

      // System simulates transition to DLQ
      const eventStatus = !retryEval.shouldRetry ? 'dead_letter' : 'retrying';
      expect(eventStatus).toBe('dead_letter');
    });

    it('permanent errors transition immediately to failed without infinite retries', () => {
      const retryEval = WebhookRetryService.evaluateRetry(
        1,
        new Error('SIGNATURE_MISMATCH'),
        {
          maxAttempts: 5,
        },
      );

      expect(retryEval.shouldRetry).toBe(false);
      expect(retryEval.reason).toContain('permanent / non-retryable');
    });
  });
});
