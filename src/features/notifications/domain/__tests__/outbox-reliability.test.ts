import { describe, expect, it } from 'vitest';

/**
 * Unit Test Suite for Notification Outbox Reliability State Machine & Backoff Logic
 * Validates state transitions, exponential backoff intervals, stale processing thresholds, and max attempts termination.
 */

export type OutboxStatus =
  | 'pending'
  | 'processing'
  | 'delivered'
  | 'failed'
  | 'exhausted';

export interface OutboxRow {
  id: string;
  status: OutboxStatus;
  attempts: number;
  max_attempts: number;
  created_at: Date;
  locked_at: Date | null;
  processed_at: Date | null;
  next_retry_at: Date | null;
}

export function calculateExponentialBackoff(
  attempts: number,
  baseIntervalSeconds = 10,
): number {
  return Math.pow(2, attempts) * baseIntervalSeconds;
}

export function isProcessingStale(
  lockedAt: Date | null,
  now: Date,
  staleThresholdMinutes = 2,
): boolean {
  if (!lockedAt) return false;
  const elapsedMs = now.getTime() - lockedAt.getTime();
  return elapsedMs >= staleThresholdMinutes * 60 * 1000;
}

export function isPendingReady(
  createdAt: Date,
  now: Date,
  gracePeriodSeconds = 15,
): boolean {
  const elapsedMs = now.getTime() - createdAt.getTime();
  return elapsedMs >= gracePeriodSeconds * 1000;
}

export function transitionOnSuccess(row: OutboxRow, now: Date): OutboxRow {
  return {
    ...row,
    status: 'delivered',
    attempts: row.attempts + 1,
    processed_at: now,
    locked_at: null,
    next_retry_at: null,
  };
}

export function transitionOnError(row: OutboxRow, now: Date): OutboxRow {
  const nextAttempts = row.attempts + 1;
  if (nextAttempts >= row.max_attempts) {
    return {
      ...row,
      status: 'exhausted',
      attempts: nextAttempts,
      locked_at: null,
    };
  }

  const backoffSeconds = calculateExponentialBackoff(nextAttempts);
  const nextRetryAt = new Date(now.getTime() + backoffSeconds * 1000);

  return {
    ...row,
    status: 'failed',
    attempts: nextAttempts,
    locked_at: null,
    next_retry_at: nextRetryAt,
  };
}

describe('Notification Outbox Reliability Engine', () => {
  const now = new Date('2026-09-15T08:00:00.000Z');

  describe('State Machine Transitions', () => {
    it('transitions to delivered on success and records processed_at', () => {
      const initialRow: OutboxRow = {
        id: 'outbox-1',
        status: 'processing',
        attempts: 0,
        max_attempts: 3,
        created_at: new Date('2026-09-15T07:58:00.000Z'),
        locked_at: now,
        processed_at: null,
        next_retry_at: null,
      };

      const updated = transitionOnSuccess(initialRow, now);

      expect(updated.status).toBe('delivered');
      expect(updated.attempts).toBe(1);
      expect(updated.processed_at).toEqual(now);
      expect(updated.locked_at).toBeNull();
    });

    it('transitions to failed with exponential backoff on retryable error', () => {
      const initialRow: OutboxRow = {
        id: 'outbox-2',
        status: 'processing',
        attempts: 0,
        max_attempts: 3,
        created_at: new Date('2026-09-15T07:58:00.000Z'),
        locked_at: now,
        processed_at: null,
        next_retry_at: null,
      };

      const updated = transitionOnError(initialRow, now);

      expect(updated.status).toBe('failed');
      expect(updated.attempts).toBe(1);
      expect(updated.locked_at).toBeNull();
      // Backoff for attempt 1 = 2^1 * 10s = 20s
      expect(updated.next_retry_at).toEqual(
        new Date('2026-09-15T08:00:20.000Z'),
      );
    });

    it('transitions to exhausted when attempts reach max_attempts', () => {
      const initialRow: OutboxRow = {
        id: 'outbox-3',
        status: 'processing',
        attempts: 2,
        max_attempts: 3,
        created_at: new Date('2026-09-15T07:50:00.000Z'),
        locked_at: now,
        processed_at: null,
        next_retry_at: null,
      };

      const updated = transitionOnError(initialRow, now);

      expect(updated.status).toBe('exhausted');
      expect(updated.attempts).toBe(3);
      expect(updated.locked_at).toBeNull();
    });
  });

  describe('Exponential Backoff Calculation', () => {
    it('calculates correct backoff progression (20s, 40s, 80s)', () => {
      expect(calculateExponentialBackoff(1)).toBe(20);
      expect(calculateExponentialBackoff(2)).toBe(40);
      expect(calculateExponentialBackoff(3)).toBe(80);
      expect(calculateExponentialBackoff(4)).toBe(160);
    });
  });

  describe('Grace Period & Crash Recovery Guards', () => {
    it('enforces 15-second grace period before pending outbox processing', () => {
      const tenSecAgo = new Date(now.getTime() - 10 * 1000);
      const twentySecAgo = new Date(now.getTime() - 20 * 1000);

      expect(isPendingReady(tenSecAgo, now)).toBe(false);
      expect(isPendingReady(twentySecAgo, now)).toBe(true);
    });

    it('identifies processing leases older than 2 minutes as stale for crash recovery', () => {
      const ninetySecAgo = new Date(now.getTime() - 90 * 1000);
      const threeMinAgo = new Date(now.getTime() - 3 * 60 * 1000);

      expect(isProcessingStale(ninetySecAgo, now)).toBe(false);
      expect(isProcessingStale(threeMinAgo, now)).toBe(true);
      expect(isProcessingStale(null, now)).toBe(false);
    });
  });
});
