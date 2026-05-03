import { useCallback } from 'react';

import { useLogBlockedTransitionEvent } from '@/application/operations/useOperationsData';
import type { TaskStatus } from '@/domain/operations/types';
import { logger } from '@/shared/utils/logger';

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
      logger.info('ops:blocked-transition', telemetryPayload);
    },
    [logBlockedTransitionMutation],
  );
}
