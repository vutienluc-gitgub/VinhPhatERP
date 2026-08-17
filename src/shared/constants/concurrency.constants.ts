export const CONCURRENCY_UI_LABELS = {
  CONFLICT_TITLE: 'Dữ liệu đã bị thay đổi',
  CONFLICT_DEFAULT_DESC:
    'Bản ghi này vừa được cập nhật bởi một người dùng khác trên hệ thống. Để tránh ghi đè dữ liệu, thao tác của bạn đã được tạm dừng.',
  TRANSITION_TITLE: 'Trạng thái không còn phù hợp',
  TRANSITION_DEFAULT_DESC:
    'Bản ghi đã được chuyển sang trạng thái khác bởi người dùng hoặc quy trình khác. Vui lòng tải lại dữ liệu mới nhất để tiếp tục.',
  TERMINAL_TITLE: 'Bản ghi đã kết thúc quy trình',
  NOT_FOUND_TITLE: 'Bản ghi không tồn tại',
  NOT_FOUND_DEFAULT_DESC:
    'Bản ghi này có thể đã bị xóa hoặc bạn không có quyền truy cập.',
  RELOAD_ACTION: 'Tải lại dữ liệu',
  DISMISS_ACTION: 'Đóng',
  RELOADING_ACTION: 'Đang tải lại...',
} as const;
