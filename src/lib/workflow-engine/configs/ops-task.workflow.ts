/**
 * Workflow Config — Operations Task (Điều hành)
 *
 * Luồng: todo → in_progress → review → done
 *              → blocked ↔ in_progress
 *              → cancelled (terminal)
 *
 * Quy tắc đặc biệt:
 * - Task urgent cần reviewer trước khi Done
 * - Cần assignee trước khi Review/Done
 * - Blocked có thể chuyển thẳng sang Done (đã nới lỏng)
 */
import type {
  TransitionContext,
  TransitionResult,
  WorkflowConfig,
} from '@/lib/workflow-engine/types';

// ── Guards ──

function requireAssignee(ctx: TransitionContext): TransitionResult {
  const assigneeId = ctx.metadata.assignee_id;
  if (!assigneeId) {
    return {
      ok: false,
      reason: 'Cần gán người phụ trách trước khi chuyển sang Review/Done',
    };
  }
  return { ok: true };
}

function requireAssigneeAndReviewerForUrgent(
  ctx: TransitionContext,
): TransitionResult {
  const assigneeId = ctx.metadata.assignee_id;
  if (!assigneeId) {
    return {
      ok: false,
      reason: 'Cần gán người phụ trách trước khi chuyển sang Done',
    };
  }

  const priority = ctx.metadata.priority;
  const reviewerId = ctx.metadata.reviewer_id;
  if (priority === 'urgent' && !reviewerId) {
    return {
      ok: false,
      reason: 'Task khẩn cấp cần reviewer xác nhận trước khi Done',
    };
  }

  return { ok: true };
}

function requireUrgentToReopen(ctx: TransitionContext): TransitionResult {
  const priority = ctx.metadata.priority;
  if (priority !== 'urgent') {
    return {
      ok: false,
      reason: 'Chỉ task khẩn cấp mới được mở lại từ Hoàn thành',
    };
  }
  return { ok: true };
}

export const opsTaskWorkflow: WorkflowConfig = {
  entity: 'ops_task',
  statuses: ['todo', 'in_progress', 'blocked', 'review', 'done', 'cancelled'],
  initialStatus: 'todo',
  terminalStatuses: ['cancelled'],
  transitions: [
    // Từ Cần làm
    { from: 'todo', to: 'in_progress', label: 'Bắt đầu' },
    { from: 'todo', to: 'blocked', label: 'Chặn' },
    { from: 'todo', to: 'cancelled', label: 'Hủy' },

    // Từ Đang làm
    {
      from: 'in_progress',
      to: 'review',
      guard: requireAssignee,
      label: 'Gửi review',
    },
    {
      from: 'in_progress',
      to: 'done',
      guard: requireAssigneeAndReviewerForUrgent,
      label: 'Hoàn thành',
    },
    { from: 'in_progress', to: 'blocked', label: 'Bị chặn' },
    { from: 'in_progress', to: 'todo', label: 'Quay lại' },

    // Từ Review
    {
      from: 'review',
      to: 'done',
      guard: requireAssigneeAndReviewerForUrgent,
      label: 'Duyệt xong',
    },
    { from: 'review', to: 'in_progress', label: 'Trả lại' },

    // Từ Bị chặn
    { from: 'blocked', to: 'in_progress', label: 'Mở chặn' },
    { from: 'blocked', to: 'todo', label: 'Quay lại' },
    {
      from: 'blocked',
      to: 'done',
      guard: requireAssigneeAndReviewerForUrgent,
      label: 'Hoàn thành',
    },

    // Từ Done — chỉ urgent mới mở lại
    {
      from: 'done',
      to: 'in_progress',
      guard: requireUrgentToReopen,
      label: 'Mở lại',
    },
    {
      from: 'done',
      to: 'todo',
      guard: requireUrgentToReopen,
      label: 'Mở lại (Todo)',
    },
  ],
};
