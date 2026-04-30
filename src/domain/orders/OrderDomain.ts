/**
 * OrderDomain — business logic thuan cho don hang ban.
 * Pure TypeScript, khong phu thuoc React hay Supabase.
 *
 * Day la nguon su that duy nhat cho:
 * - Data mapping (form values → DB payload)
 * - Total calculation
 * - Error classification (credit, stock, connection)
 * - State transition guards
 * - Order number validation
 */

import type { OrderStatus } from '@/schema/order.schema';
import type { OrderItemFormValues } from '@/schema/order.schema';

import {
  orderStateMachine,
  isOrderEditable,
  canConfirmOrder,
  canCancelOrder,
  isOrderTerminal,
} from './OrderStateMachine';
import type { OrderTransition } from './OrderStateMachine';

// ─── Re-export guards ─────────────────────────────────────────────────────────

export { isOrderEditable, canConfirmOrder, canCancelOrder, isOrderTerminal };

// ─── Calculations ─────────────────────────────────────────────────────────────

/**
 * Tinh tong gia tri don hang tu danh sach san pham.
 * Logic nay truoc day bi lap lai 3 lan trong hooks.
 */
export function calculateOrderTotal(
  items:
    | Array<{
        quantity?: number | string | null;
        unitPrice?: number | string | null;
      }>
    | null
    | undefined,
): number {
  if (!items) return 0;
  return items.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0,
  );
}

// ─── Data mapping ─────────────────────────────────────────────────────────────

export interface OrderDbPayload {
  order_number: string;
  customer_id: string;
  order_date: string;
  delivery_date: string | null;
  total_amount: number;
  notes: string | null;
  status: OrderStatus;
}

export interface OrderItemDbPayload {
  fabric_type: string;
  color_name: string | null;
  color_code: string | null;
  unit: string;
  quantity: number;
  unit_price: number;
  sort_order: number;
}

/**
 * Map form values sang DB payload cho header don hang.
 * Logic nay truoc day bi lap lai 2 lan trong useCreateOrder va useUpdateOrder.
 */
export function mapOrderFormToDb(
  values: {
    orderNumber: string;
    customerId: string;
    orderDate: string;
    deliveryDate?: string;
    notes?: string;
  },
  total: number,
  status: OrderStatus = 'draft',
): OrderDbPayload {
  return {
    order_number: values.orderNumber.trim(),
    customer_id: values.customerId,
    order_date: values.orderDate,
    delivery_date: values.deliveryDate?.trim() || null,
    total_amount: total,
    notes: values.notes?.trim() || null,
    status,
  };
}

/**
 * Map form items sang DB payload cho tung san pham.
 * Logic nay truoc day bi lap lai 3 lan trong cac hooks.
 */
export function mapOrderItemsToDb(
  items: OrderItemFormValues[],
): OrderItemDbPayload[] {
  return items.map((item, idx) => ({
    fabric_type: item.fabricType.trim(),
    color_name: item.colorName?.trim() || null,
    color_code: item.colorCode?.trim() || null,
    unit: item.unit ?? 'kg',
    quantity: item.quantity,
    unit_price: item.unitPrice,
    sort_order: idx,
  }));
}

// ─── Error classification ─────────────────────────────────────────────────────

export type OrderErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CREDIT_BLOCKED'
  | 'CREDIT_OVERDUE'
  | 'CREDIT_LIMIT_EXCEEDED'
  | 'INSUFFICIENT_STOCK'
  | 'CONCURRENT_RESERVATION'
  | 'TRANSACTION_FAILED'
  | 'INTERNAL_ERROR';

/** Credit warning: co the override neu co quyen manager */
export function isCreditWarning(code: OrderErrorCode): boolean {
  return code === 'CREDIT_OVERDUE' || code === 'CREDIT_LIMIT_EXCEEDED';
}

/** Credit blocked: khong the override */
export function isCreditBlocked(code: OrderErrorCode): boolean {
  return code === 'CREDIT_BLOCKED';
}

/** Loi ton kho: can chon cuon vai khac */
export function isStockError(code: OrderErrorCode): boolean {
  return code === 'INSUFFICIENT_STOCK';
}

/** Loi ket noi toi Edge Function (nen fallback sang direct insert) */
export function isConnectionError(error: unknown): boolean {
  if (!error) return false;
  const msg = String(
    (error as { message?: string }).message ?? error,
  ).toLowerCase();
  return (
    msg.includes('failed to send a request') ||
    msg.includes('edge function') ||
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('econnrefused') ||
    msg.includes('timeout') ||
    msg.includes('aborted')
  );
}

// ─── State transitions ────────────────────────────────────────────────────────

/** Lay danh sach transition hop le tu trang thai hien tai */
export function getAllowedOrderTransitions(
  status: OrderStatus,
): OrderTransition[] {
  return orderStateMachine.allowedTransitions(status);
}

/** Apply transition va tra ve trang thai moi */
export function applyOrderTransition(
  status: OrderStatus,
  transition: OrderTransition,
): OrderStatus {
  return orderStateMachine.apply(status, transition);
}
