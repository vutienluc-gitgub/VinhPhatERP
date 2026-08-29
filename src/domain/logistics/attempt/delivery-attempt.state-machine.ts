import type { DeliveryAttemptState } from './delivery-attempt.types';

export type DeliveryAttemptEvent =
  | 'ACCEPT_DISPATCH'
  | 'CONFIRM_PICKUP'
  | 'START_TRANSIT'
  | 'REPORT_ARRIVED'
  | 'SUBMIT_EPOD'
  | 'REPORT_EXCEPTION'
  | 'RETRY_DELIVERY'
  | 'VERIFY_COMPLETE'
  | 'RETURN_WAREHOUSE'
  | 'CANCEL_DISPATCH';

export const TERMINAL_ATTEMPT_STATES: readonly DeliveryAttemptState[] = [
  'completed',
  'returned',
  'cancelled',
] as const;

export function isTerminalAttemptState(state: DeliveryAttemptState): boolean {
  return TERMINAL_ATTEMPT_STATES.includes(state);
}

/**
 * Valid transitions mapping for Delivery Attempt State Machine.
 */
const VALID_TRANSITIONS: Record<
  DeliveryAttemptState,
  Partial<Record<DeliveryAttemptEvent, DeliveryAttemptState>>
> = {
  assigned: {
    ACCEPT_DISPATCH: 'pending_pickup',
    CANCEL_DISPATCH: 'cancelled',
  },
  pending_pickup: {
    CONFIRM_PICKUP: 'picked_up',
    CANCEL_DISPATCH: 'cancelled',
  },
  picked_up: {
    START_TRANSIT: 'in_transit',
    CANCEL_DISPATCH: 'cancelled',
  },
  in_transit: {
    REPORT_ARRIVED: 'arrived',
    REPORT_EXCEPTION: 'failed_attempt',
    CANCEL_DISPATCH: 'cancelled',
  },
  arrived: {
    SUBMIT_EPOD: 'delivered',
    REPORT_EXCEPTION: 'failed_attempt',
  },
  delivered: {
    VERIFY_COMPLETE: 'completed',
  },
  failed_attempt: {
    RETRY_DELIVERY: 'in_transit',
    RETURN_WAREHOUSE: 'returned',
  },
  completed: {},
  returned: {},
  cancelled: {},
};

export interface StateTransitionResult {
  valid: boolean;
  targetState?: DeliveryAttemptState;
  reason?: string;
}

/**
 * Evaluates whether a state transition is valid for a given delivery attempt.
 */
export function evaluateAttemptTransition(
  currentState: DeliveryAttemptState,
  event: DeliveryAttemptEvent,
): StateTransitionResult {
  if (isTerminalAttemptState(currentState)) {
    return {
      valid: false,
      reason: `Không thể chuyển đổi trạng thái từ terminal state '${currentState}'`,
    };
  }

  const possibleTransitions = VALID_TRANSITIONS[currentState];
  const targetState = possibleTransitions?.[event];

  if (!targetState) {
    return {
      valid: false,
      reason: `Sự kiện '${event}' không hợp lệ khi đang ở trạng thái '${currentState}'`,
    };
  }

  return {
    valid: true,
    targetState,
  };
}
