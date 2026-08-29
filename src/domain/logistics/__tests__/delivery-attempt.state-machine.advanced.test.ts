import { describe, it, expect } from 'vitest';

import {
  evaluateAttemptTransition,
  isTerminalAttemptState,
  TERMINAL_ATTEMPT_STATES,
  type DeliveryAttemptEvent,
} from '@/domain/logistics/attempt/delivery-attempt.state-machine';
import type { DeliveryAttemptState } from '@/domain/logistics/attempt/delivery-attempt.types';

describe('DeliveryAttempt State Machine — Advanced & Exhaustive Scenarios', () => {
  const ALL_STATES: DeliveryAttemptState[] = [
    'assigned',
    'pending_pickup',
    'picked_up',
    'in_transit',
    'arrived',
    'delivered',
    'failed_attempt',
    'completed',
    'returned',
    'cancelled',
  ];

  const ALL_EVENTS: DeliveryAttemptEvent[] = [
    'ACCEPT_DISPATCH',
    'CONFIRM_PICKUP',
    'START_TRANSIT',
    'REPORT_ARRIVED',
    'SUBMIT_EPOD',
    'REPORT_EXCEPTION',
    'RETRY_DELIVERY',
    'VERIFY_COMPLETE',
    'RETURN_WAREHOUSE',
    'CANCEL_DISPATCH',
  ];

  it('verifies happy path: assigned -> completed', () => {
    let state: DeliveryAttemptState = 'assigned';

    const happyPath: Array<{
      event: DeliveryAttemptEvent;
      expected: DeliveryAttemptState;
    }> = [
      { event: 'ACCEPT_DISPATCH', expected: 'pending_pickup' },
      { event: 'CONFIRM_PICKUP', expected: 'picked_up' },
      { event: 'START_TRANSIT', expected: 'in_transit' },
      { event: 'REPORT_ARRIVED', expected: 'arrived' },
      { event: 'SUBMIT_EPOD', expected: 'delivered' },
      { event: 'VERIFY_COMPLETE', expected: 'completed' },
    ];

    for (const step of happyPath) {
      const result = evaluateAttemptTransition(state, step.event);
      expect(result.valid).toBe(true);
      expect(result.targetState).toBe(step.expected);
      state = result.targetState!;
    }

    expect(isTerminalAttemptState(state)).toBe(true);
  });

  it('verifies recovery loop: in_transit -> exception -> retry -> delivered', () => {
    let state: DeliveryAttemptState = 'in_transit';

    // 1. Encounter customer absent
    const r1 = evaluateAttemptTransition(state, 'REPORT_EXCEPTION');
    expect(r1.valid).toBe(true);
    expect(r1.targetState).toBe('failed_attempt');
    state = r1.targetState!;

    // 2. Retry next attempt
    const r2 = evaluateAttemptTransition(state, 'RETRY_DELIVERY');
    expect(r2.valid).toBe(true);
    expect(r2.targetState).toBe('in_transit');
    state = r2.targetState!;

    // 3. Arrive at customer
    const r3 = evaluateAttemptTransition(state, 'REPORT_ARRIVED');
    expect(r3.valid).toBe(true);
    expect(r3.targetState).toBe('arrived');
    state = r3.targetState!;

    // 4. Successfully submit ePOD
    const r4 = evaluateAttemptTransition(state, 'SUBMIT_EPOD');
    expect(r4.valid).toBe(true);
    expect(r4.targetState).toBe('delivered');
  });

  it('verifies return-to-warehouse flow: failed_attempt -> returned', () => {
    let state: DeliveryAttemptState = 'in_transit';

    const r1 = evaluateAttemptTransition(state, 'REPORT_EXCEPTION');
    expect(r1.targetState).toBe('failed_attempt');
    state = r1.targetState!;

    const r2 = evaluateAttemptTransition(state, 'RETURN_WAREHOUSE');
    expect(r2.valid).toBe(true);
    expect(r2.targetState).toBe('returned');
    expect(isTerminalAttemptState(r2.targetState!)).toBe(true);
  });

  it('verifies cancellation from every non-terminal state', () => {
    const nonTerminalCancellable: DeliveryAttemptState[] = [
      'assigned',
      'pending_pickup',
      'picked_up',
      'in_transit',
    ];

    for (const st of nonTerminalCancellable) {
      const res = evaluateAttemptTransition(st, 'CANCEL_DISPATCH');
      expect(res.valid).toBe(true);
      expect(res.targetState).toBe('cancelled');
    }
  });

  it('strictly rejects any event transition once in a terminal state', () => {
    for (const term of TERMINAL_ATTEMPT_STATES) {
      for (const ev of ALL_EVENTS) {
        const res = evaluateAttemptTransition(term, ev);
        expect(res.valid).toBe(false);
        expect(res.reason).toContain('terminal state');
      }
    }
  });

  it('exhaustive transition matrix check — only explicit combinations allowed', () => {
    let validCount = 0;
    let invalidCount = 0;

    for (const st of ALL_STATES) {
      for (const ev of ALL_EVENTS) {
        const res = evaluateAttemptTransition(st, ev);
        if (res.valid) {
          validCount++;
        } else {
          invalidCount++;
        }
      }
    }

    // Total combinations = 10 states * 10 events = 100
    expect(validCount + invalidCount).toBe(100);
    // Explicit valid edges count = 14
    expect(validCount).toBe(14);
    expect(invalidCount).toBe(86);
  });
});
