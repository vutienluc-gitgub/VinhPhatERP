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

  ERR_PDF_OPEN: (num: string, err: string) =>
    `Phiếu ${num} đã được xác nhận nhưng không thể mở trình in PDF. ${err}`,
  ERR_PDF_OPEN_TITLE: 'Đã xác nhận shipment',
  ERR_CONFIRM: (err: string) => `Không thể xác nhận phiếu xuất. ${err}`,
  ERR_DELETE: (err: string) => `Không thể xóa phiếu xuất. ${err}`,
  ERR_PDF_CREATE: (num: string, err: string) =>
    `Không thể tạo phiếu PDF cho ${num}. ${err}`,
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
  ERR_TITLE: 'Lỗi:',
  PLACEHOLDER_WAREHOUSE: '— Kho xuất —',
  PLACEHOLDER_DELIVERY_ADDR: 'Địa chỉ giao hàng...',
  PLACEHOLDER_STAFF: '— Chưa phân công —',
  PLACEHOLDER_NO_APPLY: '— Không áp dụng —',
  COLOR_RAW: 'Mộc (Raw)',
  TOTAL_WEIGHT: (w: string) => `Tổng: ${w} kg`,
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

  // Sections
  SEC_GENERAL: 'Thông tin chung',
  SEC_LOGISTICS: 'Giao vận & Chi phí',
  SEC_DETAILS: 'Chi tiết hàng hoá',

  // Checkboxes
  CHK_DEBT: 'Ghi nhận vào công nợ khách hàng (tự động tạo nợ)',

  // Placeholders
  PLC_CUSTOMER: '— Chọn khách hàng —',
  PLC_WAREHOUSE: '— Kho xuất —',
  PLC_STAFF: '— Chưa phân công —',
  PLC_ADDRESS: 'Địa chỉ giao hàng...',
  PLC_NO_APPLY: '— Không áp dụng —',
  PLC_NOTES: 'Ghi chú nội bộ...',
};

export const AD_HOC_SHIPMENT_MESSAGES = {
  TITLE: 'Tạo phiếu xuất kho thủ công',
  SUBTITLE:
    'Phiếu xuất không gắn đơn hàng — tự nhập loại vải, số lượng, đơn giá.',
  CANCEL: 'Hủy',
  SAVING: 'Đang lưu...',
  CREATE: 'Tạo phiếu xuất',
  SUCCESS: 'Tạo phiếu xuất thủ công thành công',
  ERROR: 'Có lỗi xảy ra khi tạo phiếu xuất',
  ADD_ROW: 'Thêm dòng hàng',
  AT_LEAST_ONE: 'Phải có ít nhất 1 dòng hàng',
  SUMMARY_LINES: 'dòng hàng',
  SUMMARY_TOTAL: 'Tổng tiền hàng',
  SCAN_PROMPT: 'Quét hoặc nhập mã cuộn vải (ví dụ: R001):',
  SCAN_SUCCESS: 'Đã điền thông tin cuộn vải',
  SCAN_ERROR: 'Không tìm thấy cuộn vải với mã:',

  COL_FABRIC: 'Loại vải',
  COL_QTY: 'Số lượng',
  COL_UNIT: 'ĐV',
  COL_PRICE: 'Đơn giá (đ/kg)',
  COL_TOTAL: 'Thành tiền',
  LBL_TRADING_ITEMS: 'Dòng hàng xuất kho',
  TITLE_SCAN: 'Quét mã cuộn',
  TITLE_DELETE: 'Xóa dòng',
  EMPTY_ITEMS: 'Chưa có dòng hàng. Bấm',
  EMPTY_ITEMS_ACTION: 'để thêm.',
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
  ALT_SIGNATURE: 'Chữ ký khách hàng',
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

export const DISPATCH_PAGE_MESSAGES = {
  LOADING: 'Đang tải dữ liệu...',
  TITLE: 'Sa Bàn Điều Phối Giao Hàng',
  SUBTITLE: 'Kéo thả cuộn vải vào xe tải - hoặc Nhấn chọn rồi Nhấn đích.',
  COUNT_ROLLS: (count: number) => `${count} cuộn`,
  LBL_ASSIGNED: 'Đã xếp',
  ASSIGNED_SUMMARY: (count: number, kg: string) => `${count} cuộn · ${kg} kg`,
  BTN_AUTO_ASSIGN: 'Tự xếp xe',
  BTN_PROCESSING: 'Đang xử lý...',
  BTN_DISPATCH: 'Phát Lệnh',
  POOL_TITLE: (count: number) => `Kho Trung Chuyển (${count})`,
  POOL_EMPTY: 'Đã xếp hết cuộn vào xe',
};

export const DISPATCH_CONFIRM_MESSAGES = {
  ERR_NO_ORDER: 'Vui lòng chọn đơn hàng mục tiêu.',
  ERR_NO_CUSTOMER: 'Không tìm thấy thông tin khách hàng cho đơn này.',
  LBL_RETAIL_CUST: 'Khách lẻ',
  TITLE: 'Xác nhận phát lệnh giao hàng',
  HEADING: 'Xác nhận thông tin chuyến đi',
  DESC_PART_1: 'Bạn đang lên lịch phát lệnh cho',
  DESC_PART_2: 'xe chở tổng cộng',
  DESC_PART_3: 'cuộn vải. Vui lòng chỉ định',
  DESC_PART_4: 'Đơn hàng',
  DESC_PART_5: 'mà các xe này đang thi hành.',
  LBL_ORDER: 'Chọn đơn hàng xuất',
  PLC_ORDER: '— Tìm theo mã đơn / tên khách —',
  BTN_CANCEL: 'Hủy',
  BTN_COMMITTING: 'Đang phát lệnh...',
  BTN_COMMIT: 'Chốt Lệnh Ngay',
  TRUCK_BAY_SUBTITLE: (driver: string, current: string, max: number) =>
    `Tài xế: ${driver} - Tải trọng: ${current} / ${max} kg`,
};

export const FLEET_MESSAGES = {
  ERR_TRUCK_NOT_FOUND: 'Xe không tồn tại',
  ERR_ROLL_NOT_FOUND: 'Cuộn không tồn tại',
  ERR_ROLL_GRADE_C:
    'Cuộn Grade C: Mất thông tin trọng lượng! Vui lòng cân lại.',
  ERR_MATERIAL_CONFLICT: (plate: string, material: string) =>
    `Chặn ghép lô: Mâu thuẫn chất liệu. Xe ${plate} đang chuyên chở lô ${material}.`,
  ERR_TRUCK_FULL: (plate: string, max: number) =>
    `Xe ${plate} đã đầy (${max} cuộn)`,
  ERR_WEIGHT_LIMIT: (plate: string, max: number) =>
    `Vượt quá tải trọng của xe ${plate} (${max} kg)`,
  ERR_ROLL_RESERVED: 'Cuộn này đã bị khóa (reserved)',
  ERR_NO_VALID_ROLLS: 'Không có cuộn tiêu chuẩn nào khả dụng để tự xếp.',
  MSG_AUTO_SUCCESS: (count: number) =>
    `Thuật toán đã xếp thành công ${count} cuộn vải!`,
  ERR_FLEET_FULL: 'Sức chứa của đoàn xe không đủ để nhét thêm cuộn nào.',
  ERR_NO_TRUCKS_ASSIGNED: 'Chưa có xe nào được phân công tải trọng.',
  MSG_DISPATCH_SUCCESS: (count: number) =>
    `Đã chốt phát lệnh thành công ${count} chuyến xe!`,
  ERR_DISPATCH_FAIL: 'Có lỗi xảy ra trong lúc phát lệnh. Xin thử lại.',
};

export const RESOURCE_BAY_LABELS = {
  SLOT_CAPACITY: 'Sức chứa (Slot)',
  EMPTY: 'Trống',
};

export const ROLL_PICKER_MESSAGES = {
  EMPTY_ROLLS: 'Không có cuộn thành phẩm nào sẵn sàng để xuất.',
  AVAILABLE_ROLLS: (count: number) =>
    `${count} cuộn có sẵn • Nhấn để chọn/bỏ chọn`,
  SELECTED_SUMMARY: (count: number, weight: string) =>
    `${count} cuộn • ${weight} kg`,
};

export const QUICK_SHIPMENT_MESSAGES = {
  FABRIC_CODE: (idx: number) => `Mã vải ${idx}`,
  ROLL_COUNT: (count: number) => `${count} Cuộn`,
  PURPOSE_RETAIL: 'Hàng bán lẻ',
};

export const PLUGIN_MESSAGES = {
  LABEL: 'Giao hàng',
  DESC: 'Quản lý quy trình đóng gói và giao nhận hàng hóa tới khách hàng.',
};

export const DELIVERY_CONFIRM_MESSAGES = {
  TITLE: (num: string) => `Xác nhận giao hàng — ${num}`,
  LBL_RECEIVER_NAME: 'Tên người nhận',
  PLC_RECEIVER_NAME: 'Họ tên người nhận hàng',
  LBL_RECEIVER_PHONE: 'SĐT người nhận',
  LBL_RECEIVER_SIGNATURE: 'Ảnh biên nhận / chữ ký',
  LBL_DRIVER_FEE: 'Thù lao tài xế',
  LBL_FEE_AMOUNT: 'Số tiền thù lao (VNĐ)',
  LBL_BANK_ACCOUNT: 'Tài khoản ngân hàng',
  PLC_BANK_ACCOUNT: '— Chọn tài khoản —',
  HELP_FEE_EXPENSE:
    'Hệ thống sẽ tự động tạo phiếu chi danh mục Logistics khi hoàn tất giao hàng.',
  LBL_NOTES: 'Ghi chú',
  PLC_NOTES: 'Ghi chú thêm...',
  BTN_CANCEL: 'Hủy',
  BTN_SAVING: 'Đang lưu...',
  BTN_COMPLETE: 'Hoàn tất giao hàng',
};
