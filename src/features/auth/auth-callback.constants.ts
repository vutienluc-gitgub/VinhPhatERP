export const AUTH_CALLBACK = {
  TIMEOUT_MS: 10_000,

  // Labels
  LOADING_TEXT: 'Đang hoàn tất đăng nhập...',
  ERROR_TITLE: 'Lỗi đăng nhập',
  BACK_TO_LOGIN: 'Quay lại đăng nhập',

  // Error messages
  TIMEOUT_ERROR: 'Hết thời gian chờ xác thực. Vui lòng thử đăng nhập lại.',
  MISSING_CREDENTIALS_ERROR:
    'Không tìm thấy thông tin xác thực. Vui lòng đăng nhập lại.',
} as const;
