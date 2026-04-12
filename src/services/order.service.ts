import type { Order } from '@/features/orders/types';
import type { Payment } from '@/features/payments/types';

/**
 * Tính tổng công nợ cho một đơn hàng.
 */
export function calculateOrderDebt(order: Order, payments: Payment[]): number {
  const totalPaid = payments
    .filter((p) => p.order_id === order.id)
    .reduce((sum, p) => sum + p.amount, 0);
  return order.total_amount - totalPaid;
}

/**
 * Kiểm tra đơn hàng đã thanh toán đủ chưa.
 */
export function isFullyPaid(order: Order): boolean {
  return order.paid_amount >= order.total_amount;
}
