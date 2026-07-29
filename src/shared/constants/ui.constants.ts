export const UI_LABELS = {
  SELECT_PLACEHOLDER: 'Chọn...',
  SEARCH_PLACEHOLDER: 'Tìm kiếm...',
  NO_RESULTS: 'Không tìm thấy kết quả',
  CODE_PREFIX: 'Mã:',
  PHONE_PREFIX: 'SĐT:',
  ALL: 'Tất cả',
  FROM_DATE: 'Từ ngày',
  TO_DATE: 'Đến ngày',
  CANCEL: 'Hủy',
  SAVE: 'Lưu',
  CLOSE: 'Đóng',
} as const;

export const STEPPER_LABELS = {
  BACK: 'Quay lại',
  CANCEL: 'Hủy',
  NEXT: 'Tiếp tục',
  SUBMITTING: 'Đang lưu...',
  SUBMIT: 'Lưu',
} as const;

export const TABLE_LABELS = {
  NO_DATA_TITLE: 'Không tìm thấy dữ liệu',
  NO_DATA_DESC: 'Không có dữ liệu phù hợp với điều kiện.',
  SELECTED_SUFFIX: 'đã chọn',
  CANCEL_SELECTION: 'Hủy chọn',
  DISPLAY_LABEL: 'Hiển thị:',
  ROWS_SUFFIX: 'dòng',
  EXPORT_EXCEL: 'Xuất Excel',
  SHOW_COLUMNS: 'Hiển thị cột',
  SHOWING: 'Hiển thị',
  OF_TOTAL: 'trong tổng số',
  RECORDS: 'bản ghi',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  pending_review: 'Chờ duyệt',
  sent: 'Đã gửi',
  confirmed: 'Chợ SX',
  in_progress: 'Đang SX',
  completed: 'Xong',
  cancelled: 'Hủy',
} as const;
