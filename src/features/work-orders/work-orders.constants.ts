import type { BadgeVariant } from '@/shared/components';
import type { WorkOrderStatus } from '@/features/work-orders/types';

export const WORK_ORDER_MESSAGES = {
  PAGE_TITLE: 'Lệnh sản xuất',
  PAGE_SUBTITLE: 'Quản lý tiến độ và chi tiết các lệnh sản xuất dệt.',
  BTN_CREATE: 'Tạo lệnh SX',
  KPI_TOTAL: 'Tổng lệnh sản xuất',
  KPI_TOTAL_SUB: 'Tất cả các lệnh dệt',
  KPI_IN_PROGRESS: 'Đang sản xuất',
  KPI_IN_PROGRESS_SUB: 'Dây chuyền đang hoạt động',
  FILTER_SEARCH_LABEL: 'Tìm kiếm',
  FILTER_SEARCH_PLACEHOLDER: 'Mã lệnh sản xuất...',
  FILTER_STATUS_LABEL: 'Trạng thái',
  EMPTY_STATE_FILTER_TITLE: 'Không tìm thấy lệnh sản xuất',
  EMPTY_STATE_FILTER_DESC: 'Vui lòng thử điều chỉnh lại bộ lọc.',
  EMPTY_STATE_TITLE: 'Chưa có lệnh sản xuất',
  EMPTY_STATE_DESC: 'Nhấn "Tạo lệnh SX" để bắt đầu thiết lập quy trình.',
  PAGINATION_LABEL: 'lệnh sản xuất',
  COL_CODE: 'Mã Lệnh',
  COL_BOM: 'Công Thức (BOM)',
  COL_SUPPLIER: 'Đối tác dệt',
  COL_TARGET: 'Mục Tiêu',
  COL_LOOM: 'Máy dệt',
  COL_STATUS: 'Trạng Thái',
  COL_START: 'Bắt Đầu',
  BTN_VIEW: 'Chi tiết',
  BTN_EDIT: 'Sửa lệnh',
  BTN_START: 'Bắt đầu sản xuất',
};

export function getStatusVariant(status: WorkOrderStatus): BadgeVariant {
  switch (status) {
    case 'draft':
      return 'gray';
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
