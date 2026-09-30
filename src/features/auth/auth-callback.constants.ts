export const AUTH_CALLBACK = {
  TIMEOUT_MS: 10_000,

  // Labels
  LOADING_TEXT: 'Đang hoàn tất đăng nhập...',
  SUCCESS_TEXT: 'Đăng nhập thành công! Đang chuyển hướng...',
  ERROR_TITLE: 'Lỗi đăng nhập',
  BACK_TO_LOGIN: 'Quay lại đăng nhập',
  GO_TO_DASHBOARD: 'Chuyển đến Trang chủ',
  SLOW_REDIRECT_HINT:
    'Nếu trang không tự chuyển hướng sau vài giây, bấm vào đây',

  // Error messages
  TIMEOUT_ERROR: 'Hết thời gian chờ xác thực. Vui lòng thử đăng nhập lại.',
  MISSING_CREDENTIALS_ERROR:
    'Không tìm thấy thông tin xác thực. Vui lòng đăng nhập lại.',
} as const;
