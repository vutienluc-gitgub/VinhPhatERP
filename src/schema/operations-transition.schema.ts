/**
 * Operations Transition Schema — Adapter
 *
 * File này giờ là adapter mỏng: delegate toàn bộ logic sang Workflow Engine.
 * Giữ nguyên interface cũ (TransitionValidationInput, validateOpsTaskTransition)
 * để không phải sửa tất cả consumer cùng lúc.
 */
import { z } from 'zod';

import { validateTransition } from '@/lib/workflow-engine';
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

/**
 * Validate transition cho Operations Task.
 * Delegate sang Workflow Engine (single source of truth).
 */
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

  const { from, to, priority, taskType } = parsed.data;

  return validateTransition('ops_task', {
    entityId: '',
    currentStatus: from,
    targetStatus: to,
    metadata: { priority, taskType },
  });
}
