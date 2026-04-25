import { z } from 'zod';

import type {
  TaskPriority,
  TaskStatus,
  TaskType,
} from '@/features/operations/types';

const taskStatusSchema = z.enum([
  'todo',
  'in_progress',
  'blocked',
  'review',
  'done',
  'cancelled',
]);

const taskPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);
const taskTypeSchema = z.enum(['growth', 'maintenance', 'admin', 'urgent']);

const transitionSchema = z.object({
  from: taskStatusSchema,
  to: taskStatusSchema,
  priority: taskPrioritySchema,
  taskType: taskTypeSchema,
});

const BLOCKED_DONE_DIRECT =
  'Task bị chặn không thể chuyển thẳng sang Hoàn thành';
const DONE_REOPEN_URGENT_ONLY =
  'Chỉ task khẩn cấp mới được mở lại từ Hoàn thành';
const CANCELLED_LOCKED = 'Task đã huỷ không thể kéo thả trạng thái';

export interface TransitionValidationResult {
  ok: boolean;
  reason?: string;
}

export interface TransitionValidationInput {
  from: TaskStatus;
  to: TaskStatus;
  priority: TaskPriority;
  taskType: TaskType;
}

export function validateOpsTaskTransition(
  input: TransitionValidationInput,
): TransitionValidationResult {
  const parsed = transitionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: 'Dữ liệu chuyển trạng thái không hợp lệ',
    };
  }

  const { from, to, priority } = parsed.data;

  if (from === to) {
    return { ok: true };
  }

  if (from === 'cancelled') {
    return {
      ok: false,
      reason: CANCELLED_LOCKED,
    };
  }

  if (from === 'blocked' && to === 'done') {
    return {
      ok: false,
      reason: BLOCKED_DONE_DIRECT,
    };
  }

  if (from === 'done' && to !== 'done' && priority !== 'urgent') {
    return {
      ok: false,
      reason: DONE_REOPEN_URGENT_ONLY,
    };
  }

  return { ok: true };
}
