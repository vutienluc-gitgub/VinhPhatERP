import { useCallback } from 'react';

import { validateOpsTaskTransition } from '@/schema/operations-transition.schema';

type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'blocked'
  | 'review'
  | 'done'
  | 'cancelled';

type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
type TaskType = 'growth' | 'maintenance' | 'admin' | 'urgent';

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
const PRIORITY_VALUES: TaskPriority[] = ['low', 'normal', 'high', 'urgent'];
const TASK_TYPE_VALUES: TaskType[] = [
  'growth',
  'maintenance',
  'admin',
  'urgent',
];

function normalizeStatus(value: string): TaskStatus {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '_');
  return STATUS_VALUES.includes(normalized as TaskStatus)
    ? (normalized as TaskStatus)
    : 'todo';
}

function normalizePriority(value?: string | null): TaskPriority {
  const normalized = (value ?? '').trim().toLowerCase();
  return PRIORITY_VALUES.includes(normalized as TaskPriority)
    ? (normalized as TaskPriority)
    : 'normal';
}

function normalizeTaskType(value?: string | null): TaskType {
  const normalized = (value ?? '').trim().toLowerCase();
  return TASK_TYPE_VALUES.includes(normalized as TaskType)
    ? (normalized as TaskType)
    : 'maintenance';
}

export function useOperationsCommander() {
  const validateTransition = useCallback(
    (task: CommanderTask, toStatus: TaskStatus): TransitionValidation => {
      const normalizedStatus = normalizeStatus(task.status);
      const normalizedPriority = normalizePriority(task.priority);
      const normalizedTaskType = normalizeTaskType(task.task_type);

      const base = validateOpsTaskTransition({
        from: normalizedStatus,
        to: toStatus,
        priority: normalizedPriority,
        taskType: normalizedTaskType,
      });

      if (!base.ok) {
        return base;
      }

      if ((toStatus === 'review' || toStatus === 'done') && !task.assignee_id) {
        return {
          ok: false,
          reason: 'Cần gán người phụ trách trước khi chuyển sang Review/Done',
        };
      }

      if (
        toStatus === 'done' &&
        normalizedPriority === 'urgent' &&
        !task.reviewer_id
      ) {
        return {
          ok: false,
          reason: 'Task khẩn cấp cần reviewer xác nhận trước khi Done',
        };
      }

      return { ok: true };
    },
    [],
  );

  return {
    validateTransition,
  };
}
