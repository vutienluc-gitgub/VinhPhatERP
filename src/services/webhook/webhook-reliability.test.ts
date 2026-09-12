import { describe, it, expect } from 'vitest';

import { WebhookLogger } from './webhook-logger.service';
import { WebhookRetryService } from './webhook-retry.service';
import {
  ChatAiWebhookPayloadSchema,
  OrderStatusWebhookPayloadSchema,
  PushNotificationPayloadSchema,
  validateWebhookSchema,
} from './webhook-schema';

describe('WebhookReliability (P1 Engine: Schema, Retry, PII Masking & Logging)', () => {
  // ─────────────────────────────────────────────────────────────
  // 1. Exponential Backoff & Full Jitter Tests
  // ─────────────────────────────────────────────────────────────
  describe('WebhookRetryService — Exponential Backoff & Jitter', () => {
    it('calculates exponential delay with ceiling limit (maxDelayMs)', () => {
      const options = {
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        jitterRatio: 0, // Deterministic for testing base formula
      };

      // Attempt 1: 1000 * 2^0 = 1000
      expect(WebhookRetryService.calculateBackoffDelayMs(1, options)).toBe(
        1000,
      );
      // Attempt 2: 1000 * 2^1 = 2000
      expect(WebhookRetryService.calculateBackoffDelayMs(2, options)).toBe(
        2000,
      );
      // Attempt 3: 1000 * 2^2 = 4000
      expect(WebhookRetryService.calculateBackoffDelayMs(3, options)).toBe(
        4000,
      );
      // Attempt 6: 1000 * 2^5 = 32000 -> capped at maxDelayMs (30000)
      expect(WebhookRetryService.calculateBackoffDelayMs(6, options)).toBe(
        30000,
      );
      // Attempt 10: capped at 30000
      expect(WebhookRetryService.calculateBackoffDelayMs(10, options)).toBe(
        30000,
      );
    });

    it('applies Full Jitter within bounds [0, maxExponentialDelay]', () => {
      const options = {
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        jitterRatio: 1.0, // Full jitter
      };

      // Mock random source returning specific fractions
      const minDelay = WebhookRetryService.calculateBackoffDelayMs(
        3,
        options,
        () => 0.0,
      );
      const midDelay = WebhookRetryService.calculateBackoffDelayMs(
        3,
        options,
        () => 0.5,
      );
      const maxDelay = WebhookRetryService.calculateBackoffDelayMs(
        3,
        options,
        () => 1.0,
      );

      // 1000 * 2^2 = 4000
      expect(minDelay).toBe(0);
      expect(midDelay).toBe(2000);
      expect(maxDelay).toBe(4000);
    });

    it('correctly classifies transient vs permanent errors', () => {
      // Transient / Retryable
      expect(
        WebhookRetryService.isTransientError(new Error('Connection ETIMEDOUT')),
      ).toBe(true);
      expect(
        WebhookRetryService.isTransientError(new Error('Gateway Timeout 504')),
      ).toBe(true);
      expect(
        WebhookRetryService.isTransientError(
          new Error('Rate limit exceeded (429)'),
        ),
      ).toBe(true);
      expect(
        WebhookRetryService.isTransientError('Internal Server Error 500'),
      ).toBe(true);

      // Permanent / Non-retryable
      expect(
        WebhookRetryService.isTransientError(new Error('SIGNATURE_MISMATCH')),
      ).toBe(false);
      expect(
        WebhookRetryService.isTransientError(new Error('Unauthorized 401')),
      ).toBe(false);
      expect(
        WebhookRetryService.isTransientError(new Error('Forbidden 403')),
      ).toBe(false);
      expect(
        WebhookRetryService.isTransientError(
          new Error('Schema validation error'),
        ),
      ).toBe(false);
    });

    it('evaluates retry eligibility and computes nextRetryAt timestamp', () => {
      const fixedNow = new Date('2026-09-12T12:00:00.000Z');

      // Attempt 1 with transient error -> eligible
      const eval1 = WebhookRetryService.evaluateRetry(
        1,
        new Error('Network timeout'),
        { baseDelayMs: 2000, jitterRatio: 0 },
        fixedNow,
      );
      expect(eval1.shouldRetry).toBe(true);
      expect(eval1.nextAttempt).toBe(2);
      expect(eval1.delayMs).toBe(4000);
      expect(eval1.nextRetryAt?.toISOString()).toBe('2026-09-12T12:00:04.000Z');

      // Attempt 5 (maxAttempts) -> exhausted
      const evalExhausted = WebhookRetryService.evaluateRetry(
        5,
        new Error('Network timeout'),
        { maxAttempts: 5 },
        fixedNow,
      );
      expect(evalExhausted.shouldRetry).toBe(false);
      expect(evalExhausted.reason).toContain('exhausted');

      // Permanent error -> immediately rejected
      const evalPermanent = WebhookRetryService.evaluateRetry(
        1,
        new Error('Invalid signature'),
        {},
        fixedNow,
      );
      expect(evalPermanent.shouldRetry).toBe(false);
      expect(evalPermanent.reason).toContain('permanent');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Centralized Schema Validation Tests
  // ─────────────────────────────────────────────────────────────
  describe('Centralized Webhook Schemas', () => {
    it('validates a valid ChatAiWebhookPayload', () => {
      const validPayload = {
        type: 'INSERT',
        record: {
          id: '11111111-1111-4111-8111-111111111111',
          room_id: '22222222-2222-4222-8222-222222222222',
          content: 'Nhờ anh kiểm tra đơn hàng ORD-001 giúp em',
          mentions: [
            { type: 'user', id: '33333333-3333-4333-8333-333333333333' },
          ],
        },
      };

      const result = validateWebhookSchema(
        validPayload,
        ChatAiWebhookPayloadSchema,
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.record.content).toContain('kiểm tra');
      }
    });

    it('rejects ChatAiWebhookPayload with malformed UUID or missing content', () => {
      const invalidPayload = {
        type: 'INSERT',
        record: {
          id: 'not-a-valid-uuid',
          room_id: 'also-invalid',
          content: '',
        },
      };

      const result = validateWebhookSchema(
        invalidPayload,
        ChatAiWebhookPayloadSchema,
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorMessage).toContain('UUID');
        expect(result.errorMessage).toContain('content');
      }
    });

    it('validates OrderStatusWebhookPayload and rejects invalid state enum', () => {
      const validPayload = {
        orderId: '44444444-4444-4444-8444-444444444444',
        newStatus: 'confirmed',
        message: 'Đã xác nhận',
      };
      expect(
        validateWebhookSchema(validPayload, OrderStatusWebhookPayloadSchema)
          .success,
      ).toBe(true);

      const invalidPayload = {
        orderId: '44444444-4444-4444-8444-444444444444',
        newStatus: 'unsupported_random_status',
      };
      const result = validateWebhookSchema(
        invalidPayload,
        OrderStatusWebhookPayloadSchema,
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorMessage).toContain('newStatus');
      }
    });

    it('validates PushNotificationPayload with defaults', () => {
      const pushPayload = {
        title: 'Đơn hàng mới',
        body: 'Khách hàng vừa đặt đơn hàng #1234',
        priority: 'high',
      };

      const result = validateWebhookSchema(
        pushPayload,
        PushNotificationPayloadSchema,
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.domain).toBe('general');
        expect(result.data.action).toBe('view');
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Structured Logging & PII Masking Tests
  // ─────────────────────────────────────────────────────────────
  describe('WebhookLogger — PII Masking & Correlation Context', () => {
    it('masks phone numbers in string messages', () => {
      const input = 'Liên hệ khách hàng qua số 0912345678 hoặc 0898765432';
      const output = WebhookLogger.maskPiiString(input);
      expect(output).not.toContain('0912345678');
      expect(output).toContain('0912***678');
      expect(output).toContain('0898***432');
    });

    it('masks Bearer tokens and passwords in log messages', () => {
      const input =
        'Call failed with Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 and password=secretPass123';
      const output = WebhookLogger.maskPiiString(input);
      expect(output).toContain('Bearer ***');
      expect(output).toContain('password=***');
      expect(output).not.toContain('eyJ');
      expect(output).not.toContain('secretPass123');
    });

    it('masks monetary amounts in Vietnamese and foreign currency', () => {
      const input = 'Tổng đơn hàng là 120.000.000 đ hoặc 5,000 USD';
      const output = WebhookLogger.maskPiiString(input);
      expect(output).not.toContain('120.000.000');
      expect(output).not.toContain('5,000 USD');
      expect(output).toContain('***');
    });

    it('deep-sanitizes nested JSON objects without mutating original data', () => {
      const original = {
        user: {
          name: 'Nguyen Van A',
          phone: '0901234567',
          token: 'sensitive_jwt_token_here',
          credentials: {
            password: 'mySuperSecretPassword',
          },
        },
        meta: {
          amount: '50.000.000 VND',
        },
      };

      const sanitized = WebhookLogger.sanitizePayload(
        original,
      ) as typeof original;

      expect(sanitized.user.phone).toBe('0901***567');
      expect(sanitized.user.token).toBe('***');
      expect(sanitized.user.credentials.password).toBe('***');
      expect(sanitized.meta.amount).toBe('***');
      // Original object not mutated
      expect(original.user.token).toBe('sensitive_jwt_token_here');
    });

    it('generates standard structured JSON with correlation fields', () => {
      const jsonLog = WebhookLogger.formatLog(
        'info',
        'Xử lý webhook đơn hàng #001',
        {
          correlationId: 'corr_test_123',
          eventId: 'evt_001',
          durationMs: 45,
        },
      );

      const parsed = JSON.parse(jsonLog);
      expect(parsed.level).toBe('INFO');
      expect(parsed.correlationId).toBe('corr_test_123');
      expect(parsed.eventId).toBe('evt_001');
      expect(parsed.durationMs).toBe(45);
      expect(parsed.timestamp).toBeDefined();
    });
  });
});
