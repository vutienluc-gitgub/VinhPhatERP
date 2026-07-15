export const SHIPMENT_LIST_MESSAGES = {
  PAGE_TITLE: 'Xuất kho & Giao hàng',
  PAGE_SUBTITLE: 'Quản lý phiếu xuất, điều phối tài xế và lộ trình giao hàng',

  BTN_CREATE_MANUAL: 'Phiếu xuất thủ công',
  BTN_DISPATCH_BOARD: 'Sa Bàn Điều Phối',
  BTN_QUICK_PRINT: 'In Nhanh K80',

  STAT_COUNT_TITLE: 'Số chuyến (Trang)',
  STAT_COST_TITLE: 'Tổng cước (Trang)',
  STAT_PENDING_TITLE: 'Chờ xác nhận',

  FILTER_SEARCH_LABEL: 'Tìm kiếm',
  FILTER_SEARCH_PLACEHOLDER: 'Số phiếu xuất, tên khách...',
  FILTER_STAFF_LABEL: 'Tài xế giao hàng',
  FILTER_TYPE_LABEL: 'Loại phiếu',
  FILTER_TYPE_ALL: 'Tất cả phiếu',
  FILTER_TYPE_MANUAL: 'Phiếu xuất thủ công',

  TAB_ALL: 'Tất cả',
  TAB_PREPARING: 'Đang chuẩn bị',
  TAB_SHIPPED: 'Đang đi giao',
  TAB_DELIVERED: 'Đã nhận hàng',

  EMPTY_STATE_FILTER_TITLE: 'Không tìm thấy phiếu xuất',
  EMPTY_STATE_FILTER_DESC: 'Hãy thử thay đổi tiêu chí tìm kiếm.',
  EMPTY_STATE_DEFAULT_TITLE: 'Chưa có phiếu xuất kho',
  EMPTY_STATE_DEFAULT_DESC:
    'Sẽ có dữ liệu ở đây khi có yêu cầu chuyển hàng hoặc đơn giao cần xử lý.',

  COL_SHIPMENT: 'Phiếu giao',
  COL_DATE_COST: 'Thời gian & Cước',
  COL_ROUTE: 'Lộ trình',
  COL_DRIVER: 'Tài xế',

  LBL_CUSTOMER: 'Khách',
  LBL_ORDER: 'ĐH',
  LBL_MANUAL: 'Thủ công',
  LBL_COST: 'Cước',
  LBL_ORIGIN: 'Kho Vĩnh Phát',
  LBL_UNKNOWN_DEST: 'Chưa rõ địa chỉ đích',
  LBL_UNASSIGNED: '[Tìm tài xế] Chưa phân công',
  LBL_NO_PHONE: 'Không rõ sđt',

  BTN_CONFIRM: 'Xác nhận & Mở PDF',
  BTN_DELETE: 'Xóa',
  BTN_PRINT_A4: 'In A4',
  BTN_PRINT_A5: 'In A5 (Kim)',
  BTN_RECEIVE: 'Nhận hàng',
  BTN_RECEIVE_UPPER: 'XÁC NHẬN GIAO HÀNG',

  ERR_LOAD: 'Lỗi tải dữ liệu:',
  ERR_GENERIC: 'Lỗi:',
  ERR_UNKNOWN: 'Đã xảy ra lỗi không xác định.',

  CONFIRM_DELIVERY_MSG: (num: string) =>
    `Xác nhận xuất kho phiếu "${num}"? Hệ thống sẽ chuyển trạng thái sang Đã giao và mở phiếu PDF để in hoặc lưu.`,
  CONFIRM_DELETE_MSG: 'Xoá phiếu xuất? Cuộn vải sẽ trả lại kho.',
  DELETE_SUCCESS: 'Xoá phiếu xuất thành công',
};
import type { Shipment } from './types';

export const SHIPMENT_FORM_MESSAGES = {
  TITLE: (orderNumber: string) => `Tạo phiếu xuất — ${orderNumber}`,
  CANCEL: 'Hủy',
  SAVE: 'Lưu',
  SAVING: 'Đang lưu...',
  CREATE: 'Tạo phiếu xuất',
  CREATE_BTN: (count: number, isTrading: boolean) =>
    `Tạo phiếu xuất (${count} ${isTrading ? 'dòng' : 'cuộn'})`,

  AUTO_NUMBER: 'Tự động',
  SELECT_ROLL_REQUIRED: 'Vui lòng chọn ít nhất một cuộn vải để xuất.',
  CREATE_SUCCESS: 'Tạo phiếu xuất thành công',
  CREATE_ERROR: 'Có lỗi xảy ra khi tạo phiếu xuất',
  SELECT_ROLL_LABEL: 'Chọn cuộn xuất kho',
  TRADING_ITEM_LABEL: 'Dòng hàng xuất kho',
  TRADING_AUTO_DEDUCT: 'Đã trừ kho tự động',
  TRADING_FROM_ORDER: 'Hàng hóa từ đơn thương mại',
  ROLL_SELECTED: (count: number) => `✓ ${count} cuộn đã chọn`,
  TOTAL_TRADING: (count: number) => `Tổng cộng: ${count} dòng hàng`,
};

export const AD_HOC_SHIPMENT_LABELS = {
  SHIPMENT_NUMBER: 'Số phiếu xuất',
  SHIPMENT_DATE: 'Ngày giao',
  CUSTOMER: 'Khách hàng',
  EMPLOYEE: 'Nhân viên kho',
  DELIVERY_ADDRESS: 'Địa chỉ giao',
  DELIVERY_STAFF: 'Nhân viên giao hàng',
  VEHICLE_INFO: 'Biển số xe',
  SHIPPING_RATE: 'Bảng giá cước',
  SHIPPING_COST: 'Chi phí vận chuyển (VNĐ)',
  LOADING_FEE: 'Phí bốc xếp (VNĐ)',
  NOTES: 'Ghi chú',
  PURPOSE: 'Mục đích xuất',
};

export const AD_HOC_PURPOSE_OPTIONS = [
  { value: 'Hàng bán lẻ', label: 'Hàng bán lẻ' },
  { value: 'Hàng mẫu', label: 'Hàng mẫu' },
  { value: 'Đền bù lỗi', label: 'Đền bù lỗi' },
  { value: 'Tiêu hao nội bộ', label: 'Tiêu hao nội bộ' },
  { value: 'Khác', label: 'Khác' },
];

export const VERIFY_PAGE_MESSAGES = {
  LOADING: 'Đang tải...',
  NOT_FOUND_TITLE: 'Không tìm thấy phiếu',
  NOT_FOUND_DESC: (num: string) =>
    `Mã phiếu ${num} không tồn tại hoặc đã bị xoá.`,
  ERROR_GENERIC: 'Có lỗi xảy ra',
  DOC_TITLE: 'VinhPhat — Chứng từ giao hàng',
  DELIVERY_DATE: 'Ngày giao:',
  STATUS_LBL: 'Trạng thái',
  DELIVERY_INFO: 'Thông tin giao hàng',
  ITEM_LIST: (count: number) => `Danh sách hàng (${count} dòng)`,
  JOURNEY_TITLE: 'Hành trình giao hàng',
  SIGNATURE_TITLE: 'Chữ ký xác nhận nhận hàng',
  SIGNED_AT: 'Ký lúc:',
  FOOTER_TEXT: 'Trang xác minh chứng từ — VinhPhat ERP',
  FOOTER_SUBTEXT: 'Chỉ xem, không cần đăng nhập',
};

export const VERIFY_STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
};

export const VERIFY_JOURNEY_LABELS: Record<string, string> = {
  pending_pickup: 'Chờ lấy hàng',
  picked_up: 'Đã lấy hàng',
  in_transit: 'Đang trên đường',
  arrived: 'Đã đến nơi',
  delivered_confirmed: 'Đã giao - Xác nhận',
};

export const VERIFY_JOURNEY_ORDER = [
  'pending_pickup',
  'picked_up',
  'in_transit',
  'arrived',
  'delivered_confirmed',
];

export function calcShipmentCost(s: Shipment): number {
  return (s.shipping_cost || 0) + (s.loading_fee || 0);
}
