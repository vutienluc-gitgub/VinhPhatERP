/**
 * ProductionStateMachine — state machines cho toan bo quy trinh san xuat.
 * Bounded Context: Production (work-orders, dyeing, weaving)
 *
 * Luong chinh:
 *   WorkOrder: draft → yarn_issued → in_progress → completed | cancelled
 *   DyeingOrder: draft → sent → in_progress → completed | cancelled
 *   WeavingInvoice: draft → confirmed → paid
 */

import { StateMachine } from '@/domain/shared/StateMachine';
import type { WorkOrderStatus } from '@/schema/work-order.schema';
import type { DyeingOrderStatus } from '@/schema/dyeing-order.schema';

// ─── Work Order State Machine ─────────────────────────────────────────────────

export type WorkOrderTransition =
  | 'issue_yarn'
  | 'start_production'
  | 'complete'
  | 'cancel';

export const workOrderStateMachine = new StateMachine<
  WorkOrderStatus,
  WorkOrderTransition
>(
  {
    draft: ['issue_yarn', 'cancel'],
    yarn_issued: ['start_production', 'cancel'],
    in_progress: ['complete'],
    completed: [],
    cancelled: [],
  },
  {
    issue_yarn: 'yarn_issued',
    start_production: 'in_progress',
    complete: 'completed',
    cancel: 'cancelled',
  },
);

export const WORK_ORDER_TRANSITION_LABELS: Record<WorkOrderTransition, string> =
  {
    issue_yarn: 'Xuat soi',
    start_production: 'Bat dau san xuat',
    complete: 'Hoan thanh',
    cancel: 'Huy lenh',
  };

// ─── Dyeing Order State Machine ───────────────────────────────────────────────

export type DyeingTransition =
  | 'send_to_supplier'
  | 'start_dyeing'
  | 'complete'
  | 'cancel';

export const dyeingStateMachine = new StateMachine<
  DyeingOrderStatus,
  DyeingTransition
>(
  {
    draft: ['send_to_supplier', 'cancel'],
    sent: ['start_dyeing', 'cancel'],
    in_progress: ['complete'],
    completed: [],
    cancelled: [],
  },
  {
    send_to_supplier: 'sent',
    start_dyeing: 'in_progress',
    complete: 'completed',
    cancel: 'cancelled',
  },
);

export const DYEING_TRANSITION_LABELS: Record<DyeingTransition, string> = {
  send_to_supplier: 'Gui nha nhuom',
  start_dyeing: 'Bat dau nhuom',
  complete: 'Hoan thanh',
  cancel: 'Huy lenh',
};

// ─── Weaving Invoice Status (simpler, no state machine needed) ────────────────

export type WeavingInvoiceStatus = 'draft' | 'confirmed' | 'paid';

// ─── Guards ───────────────────────────────────────────────────────────────────

export function isWorkOrderEditable(status: WorkOrderStatus): boolean {
  return status === 'draft';
}

export function isWorkOrderTerminal(status: WorkOrderStatus): boolean {
  return status === 'completed' || status === 'cancelled';
}

export function isDyeingOrderEditable(status: DyeingOrderStatus): boolean {
  return status === 'draft';
}

export function isDyeingOrderTerminal(status: DyeingOrderStatus): boolean {
  return status === 'completed' || status === 'cancelled';
}
