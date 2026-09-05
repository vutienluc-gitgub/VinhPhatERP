import type {
  OrderKanbanItem,
  OrderKanbanStatus,
} from '@/domain/orders/kanban.types';
import type { IconName } from '@/shared/components';

export interface KanbanColumnDef {
  status: OrderKanbanStatus;
  label: string;
  icon: IconName;
  accentClass: string;
}

export const KANBAN_COLUMNS: KanbanColumnDef[] = [
  {
    status: 'pending_review',
    label: 'Chờ duyệt',
    icon: 'Clock',
    accentClass: 'border-warning/30 text-warning',
  },
  {
    status: 'draft',
    label: 'Bản nháp',
    icon: 'Pencil',
    accentClass: 'border-border text-muted-foreground',
  },
  {
    status: 'confirmed',
    label: 'Đã xác nhận',
    icon: 'CircleCheck',
    accentClass: 'border-primary/40 text-primary',
  },
  {
    status: 'in_progress',
    label: 'Đang sản xuất',
    icon: 'Layers',
    accentClass: 'border-info/40 text-info',
  },
  {
    status: 'completed',
    label: 'Hoàn thành',
    icon: 'CheckCheck',
    accentClass: 'border-success/40 text-success',
  },
];

/* ── Vietnamese labels ── */
export const KANBAN_LABELS = {
  SEARCH_PLACEHOLDER: 'Tìm mã đơn, tên khách...',
  ORDER_COUNT_SUFFIX: 'đơn hàng',
  TOTAL_AMOUNT_LABEL: 'Tổng giá trị:',
  OVERDUE_SUFFIX: 'quá hạn',
  OVERDUE_TAG: 'Quá hạn',
  EMPTY_COLUMN: 'Không có đơn hàng',
  ERROR_PREFIX: 'Lỗi tải dữ liệu:',
  SHOW_OVERDUE_ONLY: 'Chỉ đơn quá hạn',
  SHOW_ALL: 'Tất cả đơn',
  VIEW_DETAILS: 'Xem chi tiết',
  TOTAL_PIPELINE: 'Doanh thu pipeline',
  SHOW_CANCELLED: 'Hiện đơn đã hủy',
  HIDE_CANCELLED: 'Ẩn đơn đã hủy',
  CANCELLED_COLUMN_LABEL: 'Đã hủy',
  CONFIRM_CANCEL_TITLE: 'Xác nhận hủy đơn hàng',
  CONFIRM_CANCEL_DESC:
    'Bạn có chắc chắn muốn hủy đơn hàng này không? Thao tác này không thể hoàn tác.',
  CANCEL_BUTTON: 'Đóng',
  CONFIRM_BUTTON: 'Xác nhận hủy',
  STATUS_UPDATE_SUCCESS: 'Đã cập nhật trạng thái đơn hàng {orderNumber}',
  STATUS_UPDATE_ERROR: 'Không thể cập nhật trạng thái: {error}',
} as const;

/* ── Shared predicate ── */
export function isOrderOverdue(order: OrderKanbanItem): boolean {
  return (
    Boolean(order.delivery_date) &&
    new Date(order.delivery_date) < new Date() &&
    order.status !== 'completed' &&
    order.status !== 'cancelled'
  );
}

/* ── Calculation helper (without reduce) ── */
export function calculateTotalAmount(items: OrderKanbanItem[]): number {
  let sum = 0;
  for (let i = 0; i < items.length; i += 1) {
    const amount = items[i]?.total_amount;
    if (typeof amount === 'number' && !Number.isNaN(amount)) {
      sum += amount;
    }
  }
  return sum;
}
