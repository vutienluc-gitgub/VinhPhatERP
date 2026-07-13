import { type BadgeVariant } from '@/shared/components';

export const WEAVING_INVOICE_MESSAGES = {
  PAGE_TITLE: 'Hóa đơn dệt',
  PAGE_SUBTITLE: 'Quản lý hóa đơn dệt, thanh toán và nhập kho vải mộc.',
  BTN_CREATE: 'Tạo phiếu',
  KPI_TOTAL_TITLE: 'Tổng phiếu gia công',
  KPI_TOTAL_SUB: 'Tất cả phiếu nhập kho dệt',
  KPI_DRAFT_TITLE: 'Chờ xác nhận',
  KPI_DRAFT_SUB: 'Phiếu nháp chưa nhập kho',
  FILTER_SEARCH_LABEL: 'Tìm kiếm',
  FILTER_SEARCH_PLACEHOLDER: 'Số phiếu gia công...',
  FILTER_STATUS_LABEL: 'Trạng thái',
  EMPTY_STATE_FILTER_TITLE: 'Không tìm thấy phiếu gia công',
  EMPTY_STATE_FILTER_DESC: 'Thử điều chỉnh bộ lọc.',
  EMPTY_STATE_TITLE: 'Chưa có phiếu gia công nào',
  EMPTY_STATE_DESC: 'Nhấn "+ Tạo phiếu" để bắt đầu nhập cuộn vải từ nhà dệt.',
  COL_INVOICE: 'Số phiếu',
  COL_SUPPLIER: 'Nhà dệt',
  COL_FABRIC: 'Loại vải',
  COL_WEIGHT: 'Tổng KG',
  COL_AMOUNT: 'Thành tiền',
  COL_PAID: 'Đã trả',
  COL_STATUS: 'Trạng thái',
  COL_ACTIONS: 'Thao tác',
  BTN_EDIT: 'Sửa',
  BTN_CONFIRM: 'Xác nhận & nhập kho',
  BTN_DELETE: 'Xóa',
  BTN_LOOKUP: 'Tra cứu QR & in hóa đơn',
  ERR_LOAD: 'Lỗi tải dữ liệu:',
  ERR_CONFIRM: 'Lỗi xác nhận phiếu. ',
  ERR_DELETE: 'Lỗi xóa phiếu. ',
  CONFIRM_MSG: (no: string, count: number) =>
    `Xác nhận phiếu "${no}"? Hệ thống sẽ tự động nhập ${count} cuộn vào kho vải mộc.`,
  DELETE_MSG: (no: string) => `Xóa phiếu nháp "${no}"?`,
  STATUS_DRAFT: 'Nháp',
  STATUS_CONFIRMED: 'Đã xác nhận',
  STATUS_PAID: 'Đã thanh toán',
  UNSAVED_WARNING: 'Bạn có thông tin chưa lưu. Bạn có chắc chắn muốn đóng?',
  LOADING_INVOICE: 'Đang tải dữ liệu phiếu...',
};

export function getStatusVariant(status: string): BadgeVariant {
  if (status === 'confirmed') return 'success';
  if (status === 'paid') return 'info';
  return 'gray';
}
