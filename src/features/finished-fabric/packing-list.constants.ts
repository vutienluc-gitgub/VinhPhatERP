/**
 * Constants and Vietnamese UI texts for Fabric Roll Packing List.
 * Follows VinhPhatERP centralized text rules.
 */

export const PACKING_LIST_TEXT = {
  TITLE: 'Bảng kê danh sách cây vải (Packing List)',
  SUBTITLE:
    'Chi tiết thông số kỹ thuật từng cây vải thành phẩm, khối lượng tịnh và phân loại phẩm cấp.',
  TOTAL_ROLLS: 'Tổng số cây',
  TOTAL_WEIGHT: 'Tổng khối lượng',
  AVG_WEIGHT: 'Khối lượng TB',
  CHECKOFF_PROGRESS: 'Tiến độ kiểm đếm',
  GRADE_A_LABEL: 'Loại A (Xuất sắc)',
  GRADE_B_LABEL: 'Loại B (Lỗi nhẹ)',
  GRADE_OTHER_LABEL: 'Phẩm cấp khác',

  // Actions
  SEARCH_PLACEHOLDER: 'Tìm theo mã cây vải, mặt hàng, lô nhuộm...',
  FILTER_ALL_COLORS: 'Tất cả màu',
  FILTER_ALL_GRADES: 'Tất cả phẩm cấp',
  FILTER_CHECKED_ONLY: 'Đã kiểm đếm',
  FILTER_UNCHECKED_ONLY: 'Chưa kiểm đếm',
  VIEW_TABLE: 'Xem bảng chi tiết',
  VIEW_GRID: 'Xem dạng lưới thẻ',
  VIEW_A5_MATRIX: 'Ma trận A5 (10 cây/dòng)',
  SCAN_QR_PLACEHOLDER: 'Quét hoặc nhập mã cây vải để kiểm...',
  BTN_SCAN: 'Quét Barcode/QR',
  BTN_PRINT: 'In bảng kê',
  BTN_EXPORT_EXCEL: 'Xuất file Excel',
  RESET_CHECKOFF: 'Đặt lại kiểm đếm',

  // Table columns
  COL_INDEX: 'STT',
  COL_CODE: 'Mã cây vải',
  COL_FABRIC: 'Loại vải',
  COL_COLOR: 'Màu sắc',
  COL_LOT: 'Lô nhuộm',
  COL_WIDTH: 'Khổ (inch)',
  COL_LENGTH: 'Chiều dài',
  COL_WEIGHT: 'Cân nặng (kg)',
  COL_GRADE: 'Phẩm cấp',
  COL_STATUS: 'Kiểm đếm',

  // States
  EMPTY_TITLE: 'Chưa có cây vải nào trong bảng kê',
  EMPTY_SUBTITLE:
    'Danh sách cây vải thành phẩm đang trống hoặc chưa được liên kết.',
  LOADING_TEXT: 'Đang tải bảng kê danh sách cây vải...',
} as const;
