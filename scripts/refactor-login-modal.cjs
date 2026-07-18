const fs = require('fs');

let f1 = 'src/features/fabric-catalog/fabric-catalog.constants.ts';
let c1 = fs.readFileSync(f1, 'utf8');

c1 = c1.replace(
  "loginBtn: 'Đăng nhập B2B',",
  "loginBtn: 'Đăng nhập B2B',\n  loginTitle: 'Đăng nhập tài khoản B2B',\n  loginDesc: 'Nhập email và mật khẩu của bạn để xem bảng giá sỉ và trạng thái tồn kho.',\n  emailLabel: 'Email',\n  passwordLabel: 'Mật khẩu',\n  emailPlaceholder: 'Nhập email...',\n  passwordPlaceholder: 'Nhập mật khẩu...',\n  loginSubmit: 'Đăng nhập',\n  loginPending: 'Đang xác thực...',\n  loginSuccess: 'Đăng nhập thành công!',\n  loginMissingCredentials: 'Vui lòng nhập email và mật khẩu.',\n  loginMissingCaptcha: 'Vui lòng hoàn thành xác thực bảo mật.',\n  loginUnknownError: 'Đã xảy ra lỗi không mong muốn.',\n  authErrorInvalidCredentials: 'Email hoặc mật khẩu không đúng.',\n  authErrorEmailUnconfirmed: 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.',\n  authErrorTooManyRequests: 'Đăng nhập thất bại. Vui lòng thử lại sau.',\n  authErrorNetwork: 'Không thể kết nối đến máy chủ. Kiểm tra kết nối mạng.',"
);

fs.writeFileSync(f1, c1, 'utf8');

let f2 = 'src/features/fabric-catalog/components/PublicLoginModal.tsx';
let c2 = fs.readFileSync(f2, 'utf8');

c2 = c2.replace(
  "'Vui lòng nhập email và mật khẩu.'",
  "LABELS.loginMissingCredentials"
);
c2 = c2.replace(
  "'Vui lòng hoàn thành xác thực bảo mật.'",
  "LABELS.loginMissingCaptcha"
);
c2 = c2.replace(
  "'Đăng nhập thành công!'",
  "LABELS.loginSuccess"
);
c2 = c2.replace(
  "'Đã xảy ra lỗi không mong muốn.'",
  "LABELS.loginUnknownError"
);
c2 = c2.replace(
  "Đăng nhập tài khoản B2B",
  "{LABELS.loginTitle}"
);
c2 = c2.replace(
  "Nhập email và mật khẩu của bạn để xem bảng giá sỉ và trạng thái tồn kho.",
  "{LABELS.loginDesc}"
);
c2 = c2.replace(
  "Email\n",
  "{LABELS.emailLabel}\n"
);
c2 = c2.replace(
  "placeholder=\"Nhập email...\"",
  "placeholder={LABELS.emailPlaceholder}"
);
c2 = c2.replace(
  "Mật khẩu\n",
  "{LABELS.passwordLabel}\n"
);
c2 = c2.replace(
  "placeholder=\"Nhập mật khẩu...\"",
  "placeholder={LABELS.passwordPlaceholder}"
);
c2 = c2.replace(
  "'Đang xác thực...' : 'Đăng nhập'",
  "LABELS.loginPending : LABELS.loginSubmit"
);

c2 = c2.replace(
  "'Email hoặc mật khẩu không đúng.'",
  "LABELS.authErrorInvalidCredentials"
);
c2 = c2.replace(
  "'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.'",
  "LABELS.authErrorEmailUnconfirmed"
);
c2 = c2.replace(
  "'Đăng nhập thất bại. Vui lòng thử lại sau.'",
  "LABELS.authErrorTooManyRequests"
);
c2 = c2.replace(
  "'Không thể kết nối đến máy chủ. Kiểm tra kết nối mạng.'",
  "LABELS.authErrorNetwork"
);

fs.writeFileSync(f2, c2, 'utf8');
