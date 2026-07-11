export const AUTH_MESSAGES = {
  welcomeBack: 'Chào mừng trở lại',
  loginToContinue: 'Vui lòng đăng nhập để tiếp tục',
  missingEnvTitle: 'Cấu hình chưa đủ',
  missingEnvDesc: 'Chưa có thông tin Supabase',
  missingEnvInstruction:
    'Tạo file .env.local và điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY từ trang Supabase Project Settings.',
  captchaRequired: 'Vui lòng hoàn thành xác thực bảo mật.',
  googleLoginError: 'Không thể kết nối với Google: ',
  or: 'Hoặc',
  continueWithGoogle: 'Tiếp tục với Google',
  authenticating: 'Đang xác thực…',
  loginButton: 'Đăng nhập vào hệ thống',
  errorInvalidCredentials: 'Email hoặc mật khẩu không đúng.',
  errorEmailNotConfirmed:
    'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.',
  errorTooManyRequests:
    'Đăng nhập hoặc thao tác thất bại. Vui lòng thử lại sau.',
  errorNetwork: 'Không thể kết nối đến máy chủ. Kiểm tra kết nối mạng.',
  errorUnknown: 'Lỗi không xác định',

  // Register specific
  registerSuccessTitle: 'Đăng ký thành công!',
  registerSuccessBody:
    'Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập. Đang chuyển hướng về trang đăng nhập...',
  createAccount: 'Tạo tài khoản',
  processing: 'Đang xử lý…',
  registerNow: 'Đăng ký ngay',
  errorUserAlreadyRegistered: 'Email này đã được đăng ký.',
  errorCaptchaFailed: 'Xác thực bảo mật không thành công. Vui lòng thử lại.',

  // Forgot Password specific
  checkEmailTitle: 'Kiểm tra hộp thư',
  checkEmailBody:
    'Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.',
  forgotPasswordTitle: 'Quên mật khẩu?',
  forgotPasswordSubtitle:
    'Nhập email của bạn để nhận liên kết khôi phục mật khẩu.',
  sendingRequest: 'Đang gửi yêu cầu…',
  sendRequest: 'Gửi yêu cầu',
  goBack: 'Quay lại',
  errorUserNotFound: 'Email không tồn tại hoặc chưa đăng ký.',
};

export const AUTH_LABELS = {
  email: 'Email',
  password: 'Mật khẩu',
  confirmPassword: 'Xác nhận mật khẩu',
  rememberMe: 'Ghi nhớ',
  forgotPassword: 'Quên mật khẩu?',
  emailPlaceholder: 'admin@vinhphat.vn',
  passwordPlaceholder: '••••••••',
};
