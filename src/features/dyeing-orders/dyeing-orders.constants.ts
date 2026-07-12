export const DYEING_ORDER_MESSAGES = {
  PAGE_TITLE: 'Lệnh Nhuộm',
  PAGE_SUBTITLE: 'Quản lý các lệnh nhuộm vải và theo dõi tiến độ',

  BTN_NEW: 'Tạo lệnh nhuộm',

  STAT_TOTAL: 'Tổng lệnh',
  STAT_IN_PROGRESS: 'Đang nhuộm',
  STAT_DRAFT: 'Bản nháp',

  FILTER_SEARCH_LABEL: 'Tìm kiếm',
  FILTER_SEARCH_PLACEHOLDER: 'Mã lệnh, nhà cung cấp...',

  EMPTY_STATE_TITLE: 'Chưa có lệnh nhuộm nào.',

  COL_ORDER_NUMBER: 'Mã lệnh',
  COL_SUPPLIER: 'Nhà nhuộm',
  COL_STATUS: 'Trạng thái',
  COL_PRICE: 'Đơn giá (kg)',
  COL_RETURN_DATE: 'Trả hàng (DK)',

  BTN_EDIT: 'Sửa',
  BTN_VIEW: 'Xem',
};
import { type BadgeVariant } from '@/shared/components';

export function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'draft':
      return 'gray';
    case 'sent':
      return 'info';
    case 'in_progress':
      return 'warning';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'danger';
    default:
      return 'gray';
  }
}
