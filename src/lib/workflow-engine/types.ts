/**
 * Workflow Engine — Core Types
 *
 * Single source of truth cho tất cả transition rules trong hệ thống.
 * Mỗi entity (work_order, ops_task, order_stage) có 1 WorkflowConfig riêng.
 */

/** Kết quả validate transition */
export interface TransitionResult {
  ok: boolean;
  reason?: string;
}

/** Context được truyền vào guard function */
export interface TransitionContext {
  entityId: string;
  currentStatus: string;
  targetStatus: string;
  metadata: Record<string, unknown>;
}

/** Một luật chuyển đổi trạng thái */
export interface TransitionRule {
  from: string;
  to: string;
  /** Guard function kiểm tra điều kiện chuyển đổi */
  guard?: (context: TransitionContext) => TransitionResult;
  /** Label hiển thị cho action (dùng trong UI) */
  label?: string;
}

/** Cấu hình workflow cho 1 entity */
export interface WorkflowConfig {
  /** Tên entity: 'work_order' | 'ops_task' | 'order_stage' */
  entity: string;
  /** Danh sách trạng thái hợp lệ */
  statuses: string[];
  /** Trạng thái khởi tạo mặc định */
  initialStatus: string;
  /** Danh sách transition rules */
  transitions: TransitionRule[];
  /** Trạng thái terminal — không chuyển ra được */
  terminalStatuses?: string[];
}
