/**
 * Operations Commander — Adapter
 *
 * Giờ delegate toàn bộ validation sang Workflow Engine.
 * Giữ nguyên interface (validateTransition) cho OperationsPage.
 */
import { useCallback } from 'react';

import { validateTransition } from '@/lib/workflow-engine';

type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'blocked'
  | 'review'
  | 'done'
  | 'cancelled';

interface CommanderTask {
  id: string;
  status: string;
  priority?: string | null;
  task_type?: string | null;
  assignee_id?: string | null;
  reviewer_id?: string | null;
}

interface TransitionValidation {
  ok: boolean;
  reason?: string;
}

const STATUS_VALUES: TaskStatus[] = [
  'todo',
  'in_progress',
  'blocked',
  'review',
  'done',
  'cancelled',
];

function normalizeStatus(value: string): TaskStatus {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '_');
  return STATUS_VALUES.includes(normalized as TaskStatus)
    ? (normalized as TaskStatus)
    : 'todo';
}

export function useOperationsCommander() {
  const validateTransitionFn = useCallback(
    (task: CommanderTask, toStatus: TaskStatus): TransitionValidation => {
      const normalizedStatus = normalizeStatus(task.status);

      // Delegate sang Workflow Engine — single source of truth
      return validateTransition('ops_task', {
        entityId: task.id,
        currentStatus: normalizedStatus,
        targetStatus: toStatus,
        metadata: {
          priority: task.priority ?? 'normal',
          taskType: task.task_type ?? 'maintenance',
          assignee_id: task.assignee_id,
          reviewer_id: task.reviewer_id,
        },
      });
    },
    [],
  );

  return {
    validateTransition: validateTransitionFn,
  };
}
