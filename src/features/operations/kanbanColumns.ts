import type { BadgeVariant } from '@/shared/components';

import { TASK_STATUS_LABELS } from './constants';
import type { TaskStatus } from './types';

export interface ColumnConfig {
  key: TaskStatus;
  label: string;
  tone: string;
  badgeVariant: BadgeVariant;
}

export const KANBAN_COLUMNS: ColumnConfig[] = [
  {
    key: 'todo',
    label: TASK_STATUS_LABELS.todo,
    tone: 'bg-zinc-100 text-zinc-700',
    badgeVariant: 'gray',
  },
  {
    key: 'in_progress',
    label: TASK_STATUS_LABELS.in_progress,
    tone: 'bg-indigo-100 text-indigo-700',
    badgeVariant: 'info',
  },
  {
    key: 'review',
    label: TASK_STATUS_LABELS.review,
    tone: 'bg-violet-100 text-violet-700',
    badgeVariant: 'purple',
  },
  {
    key: 'blocked',
    label: TASK_STATUS_LABELS.blocked,
    tone: 'bg-red-100 text-red-700',
    badgeVariant: 'danger',
  },
  {
    key: 'done',
    label: TASK_STATUS_LABELS.done,
    tone: 'bg-emerald-100 text-emerald-700',
    badgeVariant: 'success',
  },
];

export function getTapMoveTargetStatus(status: TaskStatus): TaskStatus | null {
  switch (status) {
    case 'todo':
      return 'in_progress';
    case 'in_progress':
      return 'review';
    case 'review':
      return 'done';
    case 'blocked':
      return 'in_progress';
    default:
      return null;
  }
}
