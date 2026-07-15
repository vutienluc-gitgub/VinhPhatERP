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
  BTN_DELETE: 'Xóa',
  BTN_BACK: 'Quay lại',
  BTN_SEND: 'Gửi đi',
  BTN_COMPLETE: 'Hoàn tất',
  BTN_PRINT: 'In phiếu',

  ERR_LOAD: 'Đang tải chi tiết...',
  ERR_NOT_FOUND: 'Không tìm thấy lệnh nhuộm.',
  ERR_DELETE: 'Không thể xoá lệnh nhuộm.',
  ERR_SEND: 'Không thể gửi lệnh nhuộm.',
  ERR_COMPLETE: 'Không thể hoàn tất lệnh nhuộm.',

  CONFIRM_SEND_MSG: 'Xác nhận gởi lệnh nhuộm này đi nhà cung cấp?',
  CONFIRM_DELETE_MSG: 'Bạn có chắc chắn muốn xóa lệnh nhuộm này?',
  CONFIRM_COMPLETE_MSG: 'Lĩnh vải thành phẩm và hoàn tất lệnh nhuộm này?',

  LBL_DATE: 'Ngày',
  LBL_NOTE: 'Ghi chú',
  LBL_TOTAL: 'Tổng',
  TITLE_ITEMS: 'Danh sách cây vải',

  COL_ITEM_ROLL: 'Mã cây vải',
  COL_ITEM_TYPE: 'Loại vải',
  COL_ITEM_WEIGHT: 'Trọng lượng (kg)',
  COL_ITEM_COLOR: 'Màu nhuộm',
  COL_ITEM_NOTE: 'Ghi chú item',

  // Form Basic Info
  FORM_TITLE_EDIT: 'Sửa lệnh nhuộm',
  FORM_TITLE_CREATE: 'Tạo lệnh nhuộm mới',
  BTN_SUBMIT_EDIT: 'Cập nhật',
  BTN_SUBMIT_CREATE: 'Tạo lệnh nhuộm',
  SECTION_BASIC_INFO: 'Thông tin chung',
  LBL_ORDER_NUMBER: 'Mã lệnh',
  LBL_AUTO: 'Tự động',
  LBL_SUPPLIER: 'Nhà nhuộm',
  PLACEHOLDER_SUPPLIER: 'Chọn nhà nhuộm...',
  LBL_ORDER_DATE: 'Ngày gởi',
  LBL_RETURN_DATE: 'Hẹn trả hàng',
  LBL_UNIT_PRICE: 'Đơn giá (đ/kg)',

  // Form Items Section
  SECTION_ITEMS: 'Danh sách cây vải',
  BTN_ADD_ITEM: 'Thêm cây vải',
  LBL_BATCH_IMPORT: 'Nhập theo lô vải mộc',
  PLACEHOLDER_BATCH: 'Chọn lô — tự động thêm toàn bộ cuộn...',
  BTN_ADD_ROLLS: 'Thêm {count} cuộn',
  BTN_ADD: 'Thêm',
  LBL_RAW_ROLL: 'Cây vải mộc',
  PLACEHOLDER_RAW_ROLL: 'Chọn cây vải...',
  LBL_TARGET_COLOR: 'Màu nhuộm mục tiêu',
  PLACEHOLDER_TARGET_COLOR: 'Tên màu...',
  LBL_WEIGHT: 'Trọng lượng (kg)',
  LBL_LENGTH: 'Chiều dài (m)',
  LBL_ITEM_NOTE: 'Ghi chú item',
  LBL_TOTAL_WEIGHT: 'Tổng trọng lượng:',

  // Global Notes
  LBL_GLOBAL_NOTE: 'Ghi chú chung',
  PLACEHOLDER_GLOBAL_NOTE: 'Nội dung ghi chú nếu có...',

  LBL_WO_LINK: 'Mã Lệnh SX',
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
