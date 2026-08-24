import { IconName } from '@/shared/components/Icon';

export const SETTINGS_MESSAGES = {
  LOAD_ERROR: 'Không thể tải cài đặt:',
  SAVE_SUCCESS: 'Đã lưu thành công!',
  SAVE_ERROR: 'Lỗi:',
  DEFAULT_ROLE_HINT:
    'Vai trò này sẽ được tự động gán cho những tài khoản mới đăng ký qua hệ thống.',
} as const;

export const SETTINGS_LABELS = {
  PAGE_TITLE: 'Cài đặt hệ thống',
  PAGE_SUBTITLE: 'Quản lý cấu hình công ty và các tham số vận hành.',
  // Company info panel
  COMPANY_INFO_TITLE: 'Thông tin công ty',
  COMPANY_NAME: 'Tên công ty',
  TAX_CODE: 'Mã số thuế',
  ADDRESS: 'Địa chỉ',
  PHONE: 'Số điện thoại',
  EMAIL: 'Email',
  WEBSITE: 'Website',
  LOGO_URL: 'Link logo',
  BANK_NAME: 'Tên ngân hàng',
  BANK_ACCOUNT: 'Số tài khoản',
  // System display panel
  SYSTEM_DISPLAY_TITLE: 'Hiển thị hệ thống',
  FLUID_LAYOUT_LABEL: 'Chế độ tràn viền (Fluid Dashboard)',
  FLUID_LAYOUT_DESC:
    'Bật công tắc này để giao diện mở rộng 100% diện tích màn hình.',
  DEFAULT_USER_ROLE: 'Vai trò mặc định cho người dùng mới',
  // Finance panel
  FINANCE_TITLE: 'Cài đặt tài chính',
  DEFAULT_CURRENCY: 'Đơn vị tiền tệ mặc định',
  DEFAULT_VAT_RATE: 'Thuế VAT mặc định (%)',
  DEFAULT_PAYMENT_TERMS: 'Hạn thanh toán mặc định (ngày)',
  DEFAULT_CREDIT_LIMIT: 'Hạn mức tín dụng mặc định (VNĐ)',
  // Numbering panel
  NUMBERING_TITLE: 'Đánh số chứng từ',
  ORDER_PREFIX: 'Prefix đơn hàng',
  QUOTATION_PREFIX: 'Prefix báo giá',
  INVOICE_PREFIX: 'Prefix hóa đơn',
  PAYMENT_PREFIX: 'Prefix phiếu thu',
  EXPENSE_PREFIX: 'Prefix phiếu chi',
  NUMBERING_RESET_YEARLY: 'Reset số thứ tự theo năm',
  NUMBERING_RESET_YEARLY_DESC:
    'Bật để số chứng từ tự động reset về 001 vào đầu năm mới.',
  // Notification panel
  NOTIFICATION_TITLE: 'Thông báo hệ thống',
  NOTIFY_NEW_ORDER: 'Thông báo khi có đơn hàng mới',
  NOTIFY_NEW_ORDER_DESC: 'Gửi thông báo cho admin và manager.',
  NOTIFY_PAYMENT_OVERDUE: 'Cảnh báo thanh toán quá hạn',
  NOTIFY_PAYMENT_OVERDUE_DESC: 'Thông báo hàng ngày về các khoản nợ quá hạn.',
  NOTIFY_LOW_STOCK: 'Cảnh báo tồn kho thấp',
  NOTIFY_LOW_STOCK_DESC: 'Thông báo khi nguyên liệu xuống dưới ngưỡng.',
  LOW_STOCK_THRESHOLD: 'Ngưỡng tồn kho tối thiểu (kg)',
  NOTIFICATION_EMAIL: 'Email nhận thông báo',
  // Production & Warehouse panel
  PRODUCTION_TITLE: 'Sản xuất & Kho',
  DEFAULT_UNIT: 'Đơn vị đo lường mặc định',
  DEFAULT_WASTE_RATE: 'Tỷ lệ hao hụt mặc định (%)',
  DEFAULT_PRODUCTION_DAYS: 'Số ngày sản xuất dự kiến',
  // Shipment panel
  SHIPMENT_TITLE: 'Giao hàng & Vận chuyển',
  DEFAULT_SHIPPING_UNIT: 'Đơn vị cước vận chuyển',
  DEFAULT_SHIPPING_REGION: 'Khu vực giao hàng mặc định',
  DEFAULT_DELIVERY_DAYS: 'Thời gian giao hàng ước tính (ngày)',
  // User management panel
  USER_MGMT_TITLE: 'Quản lý người dùng',
  ALLOW_SELF_SIGNUP: 'Cho phép tự đăng ký tài khoản',
  ALLOW_SELF_SIGNUP_DESC: 'Cho phép người dùng đăng ký không cần lời mời.',
  REQUIRE_APPROVAL: 'Yêu cầu phê duyệt tài khoản mới',
  REQUIRE_APPROVAL_DESC: 'Admin phải duyệt trước khi tài khoản được kích hoạt.',
  SESSION_TIMEOUT: 'Thời gian hết phiên (phút)',
  MAX_DEVICES: 'Số thiết bị đăng nhập đồng thời',
  // Report panel
  REPORT_TITLE: 'Báo cáo & Hiển thị',
  TIMEZONE: 'Múi giờ',
  FISCAL_YEAR_START: 'Ngày bắt đầu năm tài chính',
  DATE_FORMAT: 'Định dạng ngày',
  // Integration panel
  INTEGRATION_TITLE: 'Tích hợp & Kết nối',
  WEBHOOK_URL: 'Webhook URL',
  WEBHOOK_URL_DESC: 'Nhận thông báo tự động khi có sự kiện trong hệ thống.',
  SMTP_HOST: 'SMTP Server',
  SMTP_PORT: 'SMTP Port',
  SMTP_FROM_EMAIL: 'Email gửi đi',
  // UI panel
  UI_TITLE: 'Giao diện & Ngôn ngữ',
  THEME_MODE: 'Chế độ giao diện',
  LANGUAGE: 'Ngôn ngữ hiển thị',
  PRINT_LOGO_URL: 'Logo cho hóa đơn in',
  BRAND_COLOR: 'Màu chủ đạo',
  // Print Customizer panel
  PRINT_TITLE: 'Tùy biến Mẫu In Chứng Từ',
  PRINT_SUBTITLE:
    'Cấu hình định dạng in ấn, khổ giấy in kim, logo và ghi chú chân trang.',
  PRINT_FORMAT_LABEL: 'Khổ in mặc định',
  PRINT_FORMAT_A4_TITLE: 'A4 Laser / PDF',
  PRINT_FORMAT_A4_DESC:
    'Khổ giấy chuẩn A4 (210×297mm) cho in văn phòng và lưu trữ PDF.',
  PRINT_FORMAT_A5_TITLE: 'A5 In Kim Dot Matrix',
  PRINT_FORMAT_A5_DESC:
    'Khổ in chuyên dụng giấy đục lỗ liên tục 2-3 liên than (200×145mm).',
  PRINT_FORMAT_K80_TITLE: 'K80 In Nhiệt',
  PRINT_FORMAT_K80_DESC: 'Khổ in cuộn nhiệt 80mm cho phiếu giao hàng nhanh.',
  PRINT_ORIENTATION_LABEL: 'Hướng in',
  PRINT_ORIENTATION_PORTRAIT: 'Dọc (Portrait)',
  PRINT_ORIENTATION_LANDSCAPE: 'Ngang (Landscape)',
  PRINT_DOT_MATRIX_WIDTH: 'Chiều rộng giấy in kim',
  PRINT_DOT_MATRIX_HEIGHT: 'Chiều cao giấy in kim',
  PRINT_MARGIN_TITLE: 'Lề trang (Margin)',
  PRINT_MARGIN_TOP: 'Lề trên',
  PRINT_MARGIN_BOTTOM: 'Lề dưới',
  PRINT_MARGIN_LEFT: 'Lề trái',
  PRINT_MARGIN_RIGHT: 'Lề phải',
  PRINT_SHOW_LOGO_LABEL: 'Hiển thị Logo thương hiệu',
  PRINT_SHOW_LOGO_DESC:
    'Chèn biểu tượng nhận diện công ty ở góc trên bên trái header.',
  PRINT_SHOW_QR_LABEL: 'Hiển thị Mã QR xác thực',
  PRINT_SHOW_QR_DESC:
    'In mã QR liên kết trang kiểm tra xuất xứ và tính hợp lệ của phiếu.',
  PRINT_FOOTER_NOTE_LABEL: 'Lời nhắn & Điều khoản chân trang',
  PRINT_FOOTER_NOTE_DESC:
    'Cam kết chất lượng hoặc lưu ý kiểm tra hàng trước khi rời kho.',
  PRINT_LIVE_PREVIEW_TITLE: 'Mô phỏng mẫu in trực quan',
  PRINT_BTN_TEST: 'In Thử Ngay',
  PRINT_BTN_SAVE: 'Lưu Cài Đặt Mẫu In',
  // Settings tabs
  TAB_GENERAL: 'Tổng quan',
  TAB_FINANCE: 'Tài chính',
  TAB_OPERATIONS: 'Vận hành',
  TAB_SYSTEM: 'Hệ thống',
  // Common buttons
  BTN_UNDO: 'Hoàn tác',
  BTN_SAVING: 'Đang lưu...',
  BTN_SAVE: 'Lưu thông tin',
  // Colors Section
  COLOR_TITLE: 'Danh mục màu sắc',
  COLOR_DELETE_CONFIRM: 'Bạn có chắc chắn muốn xóa màu này?',
  COLOR_DELETE_SUCCESS: 'Đã xóa màu thành công',
  COLOR_DELETE_ERROR: 'Lỗi khi xóa:',
  COLOR_FILTER_ALL: 'Tất cả',
  COLOR_FILTER_DARK: 'Đậm',
  COLOR_FILTER_MID: 'Trung',
  COLOR_FILTER_LIGHT: 'Lợt',
  COLOR_FILTER_OTHER: 'Khác',
  COLOR_GROUP_DARK: 'Màu Đậm',
  COLOR_GROUP_MID: 'Màu Trung',
  COLOR_GROUP_LIGHT: 'Màu Lợt',
  COLOR_GROUP_UNGROUPED: 'Chưa phân nhóm',
  COLOR_EMPTY_TITLE: 'Chưa có màu sắc nào',
  COLOR_EMPTY_DESC: 'Bấm Thêm màu để tạo màu mới dùng chung cho toàn hệ thống.',
  COLOR_EMPTY_ACTION: 'Thêm màu đầu tiên',
  COLOR_EDIT_TOOLTIP: 'Chỉnh sửa',
  COLOR_DELETE_TOOLTIP: 'Xóa màu',
  COLOR_MODAL_EDIT: 'Chỉnh sửa:',
  COLOR_MODAL_NEW: 'Thêm màu mới',
  COLOR_FORM_UPDATE_SUCCESS: 'Cập nhật thành công',
  COLOR_FORM_ADD_SUCCESS: 'Thêm mới thành công',
  COLOR_FORM_ERROR: 'Có lỗi xảy ra:',
  COLOR_FORM_PLACEHOLDER: 'VD: Đỏ đô (Maroon)',
  COLOR_FORM_NOTES_PLACEHOLDER: 'Thông tin thêm...',
  COLOR_FORM_BTN_UPDATING: 'Đang lưu...',
  COLOR_FORM_BTN_UPDATE: 'Cập nhật',
  COLOR_FORM_BTN_ADD: 'Thêm mới',
  COLOR_FORM_CODE_LABEL: 'Mã màu',
  COLOR_FORM_CODE_PLACEHOLDER: 'VD: RD-02',
  COLOR_FORM_CODE_HINT: 'Mã màu không thể thay đổi sau khi tạo',
  COLOR_FORM_NAME_LABEL: 'Tên màu',
  COLOR_FORM_TREND_YEAR_LABEL: 'Năm xu hướng',
  COLOR_FORM_GROUP_LABEL: 'Nhóm màu',
  COLOR_FORM_GROUP_PLACEHOLDER: '-- Chọn nhóm màu --',
  COLOR_FORM_NOTE_LABEL: 'Ghi chú',
  COLOR_FORM_BTN_CANCEL: 'Hủy',
  // Permission Matrix
  PERM_TITLE: 'Phân quyền chi tiết',
  PERM_SUBTITLE: 'Cấu hình quyền truy cập cho tất cả vai trò',
  PERM_ADMIN_NOTE: 'Admin luôn có toàn quyền và không thể chỉnh sửa.',
  PERM_SAVE_SUCCESS: 'Đã lưu phân quyền thành công!',
  PERM_BTN_SAVE: 'Lưu thay đổi',
  PERM_BTN_UNDO: 'Hoàn tác',
  PERM_EMPTY: 'Chưa có quyền nào được cấu hình.',
  PERM_BTN_RETRY: 'Thử lại',
  PERM_SEARCH_PLACEHOLDER: 'Tìm kiếm quyền...',
  PERM_HEADER_PERMISSION: 'Quyền / Chức năng',
  PERM_DIRTY_MESSAGE: (count: number) => `Có ${count} thay đổi chưa lưu`,
} as const;

export const SETTINGS_PLACEHOLDERS = {
  COMPANY_NAME: 'VD: Công Ty TNHH Dệt May Vĩnh Phát',
  TAX_CODE: 'VD: 0312012012',
  ADDRESS: 'VD: 123 Đường Vĩnh Phát, Quận Tân Bình, TP.HCM',
  PHONE: 'VD: 0909 123 456',
  EMAIL: 'VD: info@vinhphat.com',
  WEBSITE: 'VD: https://vinhphat.com',
  LOGO_URL: 'VD: https://cdn.example.com/logo.png',
  BANK_NAME: 'VD: Vietcombank',
  BANK_ACCOUNT: 'VD: 0071001234567',
  DEFAULT_VAT_RATE: 'VD: 10',
  DEFAULT_PAYMENT_TERMS: 'VD: 30',
  DEFAULT_CREDIT_LIMIT: 'VD: 50000000',
  ORDER_PREFIX: 'VD: ĐH-',
  QUOTATION_PREFIX: 'VD: BG-',
  INVOICE_PREFIX: 'VD: HĐ-',
  PAYMENT_PREFIX: 'VD: PT-',
  EXPENSE_PREFIX: 'VD: PC-',
  LOW_STOCK_THRESHOLD: 'VD: 100',
  NOTIFICATION_EMAIL: 'VD: admin@vinhphat.com',
  DEFAULT_WASTE_RATE: 'VD: 3',
  DEFAULT_PRODUCTION_DAYS: 'VD: 14',
  DEFAULT_SHIPPING_REGION: 'VD: Miền Nam',
  DEFAULT_DELIVERY_DAYS: 'VD: 7',
  SESSION_TIMEOUT: 'VD: 480',
  MAX_DEVICES: 'VD: 3',
  FISCAL_YEAR_START: 'VD: 01/01',
  WEBHOOK_URL: 'VD: https://hooks.example.com/erp',
  SMTP_HOST: 'VD: smtp.gmail.com',
  SMTP_PORT: 'VD: 587',
  SMTP_FROM_EMAIL: 'VD: noreply@vinhphat.com',
  PRINT_LOGO_URL: 'VD: https://cdn.example.com/print-logo.png',
  BRAND_COLOR: 'VD: #0B6BCB',
} as const;

export const USER_ROLE_OPTIONS: {
  value: string;
  label: string;
  icon: IconName;
}[] = [
  { value: 'admin', label: 'Admin', icon: 'Shield' },
  { value: 'manager', label: 'Manager', icon: 'UserCog' },
  { value: 'staff', label: 'Staff', icon: 'User' },
  { value: 'driver', label: 'Driver', icon: 'Truck' },
  { value: 'viewer', label: 'Viewer', icon: 'Eye' },
  { value: 'sale', label: 'Sale', icon: 'DollarSign' },
  { value: 'customer', label: 'Customer', icon: 'Users' },
];

export const CURRENCY_OPTIONS = [
  { value: 'VND', label: 'VNĐ (Việt Nam Đồng)' },
  { value: 'USD', label: 'USD (US Dollar)' },
];

export const UNIT_OPTIONS = [
  { value: 'met', label: 'Mét (m)' },
  { value: 'yard', label: 'Yard (yd)' },
  { value: 'kg', label: 'Kilogram (kg)' },
];

export const SHIPPING_UNIT_OPTIONS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'cuon', label: 'Cuộn' },
  { value: 'kien', label: 'Kiện' },
];

export const REGION_OPTIONS = [
  { value: 'Miền Nam', label: 'Miền Nam' },
  { value: 'Miền Trung', label: 'Miền Trung' },
  { value: 'Miền Bắc', label: 'Miền Bắc' },
  { value: 'Toàn quốc', label: 'Toàn quốc' },
];

export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Ho_Chi_Minh', label: 'UTC+7 (Việt Nam)' },
  { value: 'Asia/Bangkok', label: 'UTC+7 (Bangkok)' },
  { value: 'Asia/Singapore', label: 'UTC+8 (Singapore)' },
  { value: 'Asia/Tokyo', label: 'UTC+9 (Tokyo)' },
  { value: 'UTC', label: 'UTC+0' },
];

export const DATE_FORMAT_OPTIONS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2026)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-12-31)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2026)' },
];

export const THEME_OPTIONS = [
  { value: 'light', label: 'Sáng (Light)' },
  { value: 'dark', label: 'Tối (Dark)' },
  { value: 'auto', label: 'Tự động (Auto)' },
];

export const LANGUAGE_OPTIONS = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
];
