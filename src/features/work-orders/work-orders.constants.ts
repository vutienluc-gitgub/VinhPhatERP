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
  COL_PRICE: 'Đơn giá dệt',
  COL_ACTIONS: 'Thao tác',
  BTN_VIEW: 'Chi tiết',
  BTN_EDIT: 'Sửa lệnh',
  BTN_START: 'Bắt đầu sản xuất',
  BTN_START_SHORT: 'Bắt đầu',
  CONFIRM_START: 'Bắt đầu lệnh dệt này?',
  CONFIRM_YARN_ISSUE: 'Xác nhận xuất sợi cho lệnh dệt này?',
  CONFIRM_PRODUCE: 'Bắt đầu sản xuất lệnh dệt này?',
  ERR_INVALID_TRANSITION:
    'Trạng thái chuyển đổi không hợp lệ hoặc chưa được hỗ trợ.',
  ERR_INVALID_TRANSITION_TITLE: 'Không thể chuyển đổi',
  ERR_TRANSITION_FAILED: 'Có lỗi xảy ra khi chuyển trạng thái: ',
  ERR_COMPLETE_FAILED: 'Có lỗi xảy ra khi hoàn thành lệnh: ',
  MODAL_COMPLETE_TITLE: 'Báo cáo sản lượng hoàn thành',
  MODAL_COMPLETE_ACTUAL_YIELD: 'Sản lượng thực tế (mét)',
  MODAL_COMPLETE_PLACEHOLDER: 'Nhập số mét vải mộc thực tế thu được',
  MODAL_COMPLETE_DESC:
    'Sản lượng này sẽ được dùng để tính toán hao hụt thực tế so với mục tiêu.',
  BTN_CANCEL: 'Hủy',
  BTN_CONFIRM_COMPLETE: 'Xác nhận hoàn thành',
  BTN_PROCESSING: 'Đang xử lý...',
  UNSAVED_WARNING: 'Bạn có thông tin chưa lưu. Bạn có chắc chắn muốn đóng?',
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
