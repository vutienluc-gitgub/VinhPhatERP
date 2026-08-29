import { describe, it, expect } from 'vitest';

import {
  evaluateAttemptTransition,
  isTerminalAttemptState,
  TERMINAL_ATTEMPT_STATES,
} from '@/domain/logistics/attempt/delivery-attempt.state-machine';

describe('DeliveryAttempt State Machine', () => {
  it('identifies terminal states correctly', () => {
    expect(isTerminalAttemptState('completed')).toBe(true);
    expect(isTerminalAttemptState('returned')).toBe(true);
    expect(isTerminalAttemptState('cancelled')).toBe(true);
    expect(isTerminalAttemptState('in_transit')).toBe(false);
    expect(isTerminalAttemptState('assigned')).toBe(false);
    expect(TERMINAL_ATTEMPT_STATES).toEqual([
      'completed',
      'returned',
      'cancelled',
    ]);
  });

  it('allows valid forward transitions', () => {
    // assigned -> pending_pickup
    const r1 = evaluateAttemptTransition('assigned', 'ACCEPT_DISPATCH');
    expect(r1.valid).toBe(true);
    expect(r1.targetState).toBe('pending_pickup');

    // pending_pickup -> picked_up
    const r2 = evaluateAttemptTransition('pending_pickup', 'CONFIRM_PICKUP');
    expect(r2.valid).toBe(true);
    expect(r2.targetState).toBe('picked_up');

    // picked_up -> in_transit
    const r3 = evaluateAttemptTransition('picked_up', 'START_TRANSIT');
    expect(r3.valid).toBe(true);
    expect(r3.targetState).toBe('in_transit');

    // in_transit -> arrived
    const r4 = evaluateAttemptTransition('in_transit', 'REPORT_ARRIVED');
    expect(r4.valid).toBe(true);
    expect(r4.targetState).toBe('arrived');

    // arrived -> delivered
    const r5 = evaluateAttemptTransition('arrived', 'SUBMIT_EPOD');
    expect(r5.valid).toBe(true);
    expect(r5.targetState).toBe('delivered');

    // delivered -> completed
    const r6 = evaluateAttemptTransition('delivered', 'VERIFY_COMPLETE');
    expect(r6.valid).toBe(true);
    expect(r6.targetState).toBe('completed');
  });

  it('handles exception and retry flows correctly', () => {
    // in_transit -> failed_attempt (via exception)
    const r1 = evaluateAttemptTransition('in_transit', 'REPORT_EXCEPTION');
    expect(r1.valid).toBe(true);
    expect(r1.targetState).toBe('failed_attempt');

    // failed_attempt -> in_transit (via retry)
    const r2 = evaluateAttemptTransition('failed_attempt', 'RETRY_DELIVERY');
    expect(r2.valid).toBe(true);
    expect(r2.targetState).toBe('in_transit');

    // failed_attempt -> returned (via return to warehouse)
    const r3 = evaluateAttemptTransition('failed_attempt', 'RETURN_WAREHOUSE');
    expect(r3.valid).toBe(true);
    expect(r3.targetState).toBe('returned');
  });

  it('rejects invalid transitions', () => {
    // Cannot jump directly from assigned to delivered
    const invalidJump = evaluateAttemptTransition('assigned', 'SUBMIT_EPOD');
    expect(invalidJump.valid).toBe(false);
    expect(invalidJump.reason).toContain('không hợp lệ');

    // Cannot transition from terminal state completed
    const fromTerminal = evaluateAttemptTransition(
      'completed',
      'START_TRANSIT',
    );
    expect(fromTerminal.valid).toBe(false);
    expect(fromTerminal.reason).toContain('terminal state');
  });
});
