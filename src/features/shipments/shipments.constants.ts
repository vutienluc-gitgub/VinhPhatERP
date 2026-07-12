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
};
import type { Shipment } from './types';

export function calcShipmentCost(s: Shipment): number {
  return (s.shipping_cost || 0) + (s.loading_fee || 0);
}
