import type { OrderKanbanItem } from './types';

/* ── Vietnamese labels ── */
export const KANBAN_LABELS = {
  SEARCH_PLACEHOLDER: 'Tìm mã đơn, tên khách...',
  ORDER_COUNT_SUFFIX: 'đơn hàng',
  OVERDUE_SUFFIX: 'quá hạn',
  OVERDUE_TAG: 'Quá hạn',
  EMPTY_COLUMN: 'Không có đơn hàng',
  ERROR_PREFIX: 'Lỗi tải dữ liệu:',
} as const;

/* ── Shared predicate ── */
export function isOrderOverdue(order: OrderKanbanItem): boolean {
  return (
    Boolean(order.delivery_date) &&
    new Date(order.delivery_date) < new Date() &&
    order.status !== 'completed'
  );
}
