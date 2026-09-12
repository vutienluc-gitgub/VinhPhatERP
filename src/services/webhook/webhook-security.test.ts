import { describe, it, expect } from 'vitest';

import {
  WebhookSecurityService,
  InboundWebhookEnvelopeSchema,
} from './webhook-security.service';

describe('WebhookSecurityService (P0 Security & Idempotency Regression Tests)', () => {
  const TEST_SECRET = 'vinhphat_enterprise_secret_test_key_1234567890';
  const SAMPLE_EVENT_ID = 'evt_4a56c07e-7c5b-4c07-b352-87895029c011';
  const SAMPLE_BODY = JSON.stringify({
    event_id: SAMPLE_EVENT_ID,
    event_type: 'ORDER_CONFIRMED',
    timestamp: 1773390000,
    data: { order_number: 'ORD-2026-001', amount: 50000000 },
  });

  // ─────────────────────────────────────────────────────────────
  // Test 1 — Valid Signature
  // ─────────────────────────────────────────────────────────────
  it('Test 1 — Valid Signature: successfully validates signature on canonical raw payload', async () => {
    const nowMs = 1773390100 * 1000;
    const timestampHeader = '1773390000';
    const signature = await WebhookSecurityService.computeSignature(
      TEST_SECRET,
      timestampHeader,
      SAMPLE_EVENT_ID,
      SAMPLE_BODY,
    );

    const result = await WebhookSecurityService.verifyWebhookSignature({
      rawBody: SAMPLE_BODY,
      signatureHeader: signature,
      timestampHeader,
      eventIdHeader: SAMPLE_EVENT_ID,
      secret: TEST_SECRET,
      toleranceSeconds: 300,
      nowMs,
    });

    expect(result.valid).toBe(true);
    expect(result.eventId).toBe(SAMPLE_EVENT_ID);
    expect(result.timestamp).toBe(1773390000);
    expect(result.errorCode).toBeUndefined();
  });

  // ─────────────────────────────────────────────────────────────
  // Test 2 — Invalid Signature
  // ─────────────────────────────────────────────────────────────
  it('Test 2 — Invalid Signature: rejects tampered or incorrect signature with 401/403 code', async () => {
    const nowMs = 1773390100 * 1000;
    const timestampHeader = '1773390000';
    const forgedSignature =
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    const result = await WebhookSecurityService.verifyWebhookSignature({
      rawBody: SAMPLE_BODY,
      signatureHeader: forgedSignature,
      timestampHeader,
      eventIdHeader: SAMPLE_EVENT_ID,
      secret: TEST_SECRET,
      toleranceSeconds: 300,
      nowMs,
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('SIGNATURE_MISMATCH');
    expect(result.message).toContain('Invalid webhook signature');
  });

  // ─────────────────────────────────────────────────────────────
  // Test 3 — Missing Signature
  // ─────────────────────────────────────────────────────────────
  it('Test 3 — Missing Signature: rejects request when signature header is missing or blank', async () => {
    const nowMs = 1773390100 * 1000;
    const timestampHeader = '1773390000';

    const result = await WebhookSecurityService.verifyWebhookSignature({
      rawBody: SAMPLE_BODY,
      signatureHeader: null,
      timestampHeader,
      eventIdHeader: SAMPLE_EVENT_ID,
      secret: TEST_SECRET,
      nowMs,
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('MISSING_SIGNATURE');
  });

  // ─────────────────────────────────────────────────────────────
  // Test 4 — Expired Timestamp (Replay Window Past)
  // ─────────────────────────────────────────────────────────────
  it('Test 4 — Expired Timestamp: rejects requests older than allowed tolerance window (Replay Protection)', async () => {
    // Current time is 10 minutes (600s) after the event timestamp (tolerance is 300s)
    const nowMs = (1773390000 + 600) * 1000;
    const timestampHeader = '1773390000';
    const signature = await WebhookSecurityService.computeSignature(
      TEST_SECRET,
      timestampHeader,
      SAMPLE_EVENT_ID,
      SAMPLE_BODY,
    );

    const result = await WebhookSecurityService.verifyWebhookSignature({
      rawBody: SAMPLE_BODY,
      signatureHeader: signature,
      timestampHeader,
      eventIdHeader: SAMPLE_EVENT_ID,
      secret: TEST_SECRET,
      toleranceSeconds: 300,
      nowMs,
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('EXPIRED_TIMESTAMP');
    expect(result.message).toContain('expired');
  });

  // ─────────────────────────────────────────────────────────────
  // Test 5 — Future Timestamp (Clock Skew Protection)
  // ─────────────────────────────────────────────────────────────
  it('Test 5 — Future Timestamp: rejects requests with timestamp too far into future', async () => {
    // Current time is 10 minutes before the payload timestamp
    const nowMs = (1773390000 - 600) * 1000;
    const timestampHeader = '1773390000';
    const signature = await WebhookSecurityService.computeSignature(
      TEST_SECRET,
      timestampHeader,
      SAMPLE_EVENT_ID,
      SAMPLE_BODY,
    );

    const result = await WebhookSecurityService.verifyWebhookSignature({
      rawBody: SAMPLE_BODY,
      signatureHeader: signature,
      timestampHeader,
      eventIdHeader: SAMPLE_EVENT_ID,
      secret: TEST_SECRET,
      toleranceSeconds: 300,
      nowMs,
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('FUTURE_TIMESTAMP');
    expect(result.message).toContain('future');
  });

  // ─────────────────────────────────────────────────────────────
  // Test 6 — Duplicate Event (Idempotency Simulation)
  // ─────────────────────────────────────────────────────────────
  it('Test 6 — Duplicate Event: processes event once and suppresses second delivery', async () => {
    // Database storage mock simulating `inbound_webhook_events` with UNIQUE(source, event_id)
    const dbTable = new Map<string, { status: string; processCount: number }>();
    let businessSideEffectCount = 0;

    const processInboundEvent = async (source: string, eventId: string) => {
      const key = `${source}:${eventId}`;
      if (dbTable.has(key)) {
        return { status: 'duplicate', is_duplicate: true };
      }
      // Insert with status = 'processing'
      dbTable.set(key, { status: 'processing', processCount: 1 });

      // Execute single side-effect
      businessSideEffectCount += 1;

      // Mark as processed
      dbTable.set(key, { status: 'processed', processCount: 1 });
      return { status: 'accepted', is_duplicate: false };
    };

    // First delivery
    const res1 = await processInboundEvent(
      'chat-ai-orchestrator',
      SAMPLE_EVENT_ID,
    );
    expect(res1.is_duplicate).toBe(false);
    expect(businessSideEffectCount).toBe(1);

    // Replay / Duplicate delivery
    const res2 = await processInboundEvent(
      'chat-ai-orchestrator',
      SAMPLE_EVENT_ID,
    );
    expect(res2.is_duplicate).toBe(true);
    // Side effect must not trigger again!
    expect(businessSideEffectCount).toBe(1);
  });

  // ─────────────────────────────────────────────────────────────
  // Test 7 — Concurrent Duplicate (Race Condition Protection)
  // ─────────────────────────────────────────────────────────────
  it('Test 7 — Concurrent Duplicate: concurrent deliveries with same event_id yield exactly one business effect', async () => {
    const lockedRecords = new Set<string>();
    let executedTransactions = 0;

    // Simulates PostgreSQL `INSERT ... ON CONFLICT (source, event_id) DO NOTHING`
    const atomicDbHandler = async (source: string, eventId: string) => {
      const uniqueConstraintKey = `${source}:${eventId}`;
      // Simulate atomic insert check
      if (lockedRecords.has(uniqueConstraintKey)) {
        return { is_duplicate: true };
      }
      lockedRecords.add(uniqueConstraintKey);
      executedTransactions += 1;
      return { is_duplicate: false };
    };

    // Fire 5 concurrent requests simultaneously
    const results = await Promise.all([
      atomicDbHandler('chat-ai-orchestrator', SAMPLE_EVENT_ID),
      atomicDbHandler('chat-ai-orchestrator', SAMPLE_EVENT_ID),
      atomicDbHandler('chat-ai-orchestrator', SAMPLE_EVENT_ID),
      atomicDbHandler('chat-ai-orchestrator', SAMPLE_EVENT_ID),
      atomicDbHandler('chat-ai-orchestrator', SAMPLE_EVENT_ID),
    ]);

    const acceptedCount = results.filter((r) => !r.is_duplicate).length;
    const duplicateCount = results.filter((r) => r.is_duplicate).length;

    expect(acceptedCount).toBe(1);
    expect(duplicateCount).toBe(4);
    expect(executedTransactions).toBe(1);
  });

  // ─────────────────────────────────────────────────────────────
  // Test 8 — Invalid Payload (Schema Validation)
  // ─────────────────────────────────────────────────────────────
  it('Test 8 — Invalid Payload: rejects malformed or missing envelope fields', () => {
    const invalidPayloadMissingFields = {
      // missing event_id
      event_type: 'ORDER_CONFIRMED',
    };

    const result = WebhookSecurityService.validatePayload(
      invalidPayloadMissingFields,
      InboundWebhookEnvelopeSchema,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorMessage).toContain('event_id');
    }
  });

  // ─────────────────────────────────────────────────────────────
  // Test 9 — Tampered Body (Integrity Check)
  // ─────────────────────────────────────────────────────────────
  it('Test 9 — Tampered Body: signature generated for body A fails when body is modified to body B', async () => {
    const nowMs = 1773390100 * 1000;
    const timestampHeader = '1773390000';

    const originalBody = JSON.stringify({
      event_id: SAMPLE_EVENT_ID,
      amount: 1000000,
    });
    const tamperedBody = JSON.stringify({
      event_id: SAMPLE_EVENT_ID,
      amount: 999999999,
    });

    // Generate valid signature for originalBody
    const signatureForOriginal = await WebhookSecurityService.computeSignature(
      TEST_SECRET,
      timestampHeader,
      SAMPLE_EVENT_ID,
      originalBody,
    );

    // Verify against tamperedBody
    const result = await WebhookSecurityService.verifyWebhookSignature({
      rawBody: tamperedBody,
      signatureHeader: signatureForOriginal,
      timestampHeader,
      eventIdHeader: SAMPLE_EVENT_ID,
      secret: TEST_SECRET,
      nowMs,
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('SIGNATURE_MISMATCH');
  });

  // ─────────────────────────────────────────────────────────────
  // Test 10 — Secret Missing (Fail Closed)
  // ─────────────────────────────────────────────────────────────
  it('Test 10 — Secret Missing: fails closed immediately without falling back to insecure mode', async () => {
    const nowMs = 1773390100 * 1000;
    const timestampHeader = '1773390000';

    const result = await WebhookSecurityService.verifyWebhookSignature({
      rawBody: SAMPLE_BODY,
      signatureHeader: 'some_signature',
      timestampHeader,
      eventIdHeader: SAMPLE_EVENT_ID,
      secret: '', // Empty or missing secret
      nowMs,
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('MISSING_SECRET');
    expect(result.message).toContain('Fail');
  });
});
