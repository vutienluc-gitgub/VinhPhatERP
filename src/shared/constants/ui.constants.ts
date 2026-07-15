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

export const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  pending_review: 'Chờ duyệt',
  sent: 'Đã gửi',
  confirmed: 'Chợ SX',
  in_progress: 'Đang SX',
  completed: 'Xong',
  cancelled: 'Hủy',
} as const;
