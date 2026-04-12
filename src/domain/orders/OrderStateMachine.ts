/**
 * OrderStateMachine — state machine cho vòng đời đơn hàng.
 * Pure TypeScript, không phụ thuộc React hay Supabase.
 *
 * Luồng:
 *   draft → confirmed → in_progress → completed
 *   draft | confirmed → cancelled
 */

import { StateMachine } from '@/domain/shared/StateMachine';
import type { OrderStatus } from '@/schema/order.schema';

export type OrderTransition =
  | 'confirm'
  | 'start_production'
  | 'complete'
  | 'cancel';

export const orderStateMachine = new StateMachine<OrderStatus, OrderTransition>(
  // Allowed transitions per status
  {
    draft: ['confirm', 'cancel'],
    confirmed: ['start_production', 'cancel'],
    in_progress: ['complete'],
    completed: [],
    cancelled: [],
  },
  // Result of each transition
  {
    confirm: 'confirmed',
    start_production: 'in_progress',
    complete: 'completed',
    cancel: 'cancelled',
  },
);

export const ORDER_TRANSITION_LABELS: Record<OrderTransition, string> = {
  confirm: 'Xac nhan don',
  start_production: 'Bat dau san xuat',
  complete: 'Hoan thanh',
  cancel: 'Huy don',
};

/** Guard: don hang co the chinh sua khong */
export function isOrderEditable(status: OrderStatus): boolean {
  return status === 'draft';
}

/** Guard: don hang co the xac nhan khong */
export function canConfirmOrder(status: OrderStatus): boolean {
  return status === 'draft';
}

/** Guard: don hang co the huy khong */
export function canCancelOrder(status: OrderStatus): boolean {
  return status === 'draft' || status === 'confirmed';
}

/** Guard: don hang da ket thuc (khong the thay doi them) */
export function isOrderTerminal(status: OrderStatus): boolean {
  return status === 'completed' || status === 'cancelled';
}
