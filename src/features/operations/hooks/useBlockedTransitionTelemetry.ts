import { useCallback } from 'react';

import { useLogBlockedTransitionEvent } from '@/application/operations/useOperationsData';

type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'blocked'
  | 'review'
  | 'done'
  | 'cancelled';

interface BlockedTransitionInput {
  taskId: string;
  fromStatus: TaskStatus;
  targetStatus: TaskStatus;
  reason: string;
  source: 'preview' | 'commit';
}

const MODULE_NAME = 'operations-board';
const EVENT_NAME = 'ops:blocked-transition';

export function useBlockedTransitionTelemetry() {
  const logBlockedTransitionMutation = useLogBlockedTransitionEvent();

  return useCallback(
    (payload: BlockedTransitionInput) => {
      const telemetryPayload = {
        module: MODULE_NAME,
        ...payload,
        timestamp: new Date().toISOString(),
      };

      void logBlockedTransitionMutation.mutateAsync(telemetryPayload);

      window.dispatchEvent(
        new CustomEvent(EVENT_NAME, {
          detail: telemetryPayload,
        }),
      );
      console.info('[OpsTelemetry] blocked-transition', telemetryPayload);
    },
    [logBlockedTransitionMutation],
  );
}
