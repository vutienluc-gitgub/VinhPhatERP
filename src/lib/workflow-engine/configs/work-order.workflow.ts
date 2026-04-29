/**
 * Workflow Config — Work Order (Lệnh sản xuất)
 *
 * Luồng: draft → yarn_issued → in_progress → completed
 *                                           → cancelled (admin only)
 */
import type {
  TransitionContext,
  TransitionResult,
  WorkflowConfig,
} from '@/lib/workflow-engine/types';

// ── Guards ──

function requireAssignedSupplier(ctx: TransitionContext): TransitionResult {
  const supplierId = ctx.metadata.supplier_id;
  if (!supplierId) {
    return { ok: false, reason: 'Cần gán nhà dệt gia công trước khi xuất sợi' };
  }
  return { ok: true };
}

function requireActualYield(ctx: TransitionContext): TransitionResult {
  const actualYield = ctx.metadata.actual_yield_m;
  if (!actualYield || Number(actualYield) <= 0) {
    return {
      ok: false,
      reason: 'Cần nhập sản lượng thực tế (mét) trước khi hoàn thành',
    };
  }
  return { ok: true };
}

function requireAdminRole(ctx: TransitionContext): TransitionResult {
  const role = ctx.metadata.user_role;
  if (role !== 'admin') {
    return {
      ok: false,
      reason: 'Chỉ Quản trị viên mới được hủy lệnh đang sản xuất',
    };
  }
  return { ok: true };
}

export const workOrderWorkflow: WorkflowConfig = {
  entity: 'work_order',
  statuses: ['draft', 'yarn_issued', 'in_progress', 'completed', 'cancelled'],
  initialStatus: 'draft',
  terminalStatuses: ['cancelled'],
  transitions: [
    // Từ Bản nháp
    {
      from: 'draft',
      to: 'yarn_issued',
      guard: requireAssignedSupplier,
      label: 'Xuất sợi',
    },
    {
      from: 'draft',
      to: 'in_progress',
      guard: requireAssignedSupplier,
      label: 'Bắt đầu SX',
    },
    { from: 'draft', to: 'cancelled', label: 'Hủy lệnh' },

    // Từ Đã xuất sợi
    { from: 'yarn_issued', to: 'in_progress', label: 'Bắt đầu SX' },
    { from: 'yarn_issued', to: 'cancelled', label: 'Hủy lệnh' },

    // Từ Đang sản xuất
    {
      from: 'in_progress',
      to: 'completed',
      guard: requireActualYield,
      label: 'Hoàn thành',
    },
    {
      from: 'in_progress',
      to: 'cancelled',
      guard: requireAdminRole,
      label: 'Hủy lệnh (Admin)',
    },

    // Hoàn thành — terminal tự nhiên (không cấm nhưng không có rule chuyển ra)
  ],
};
