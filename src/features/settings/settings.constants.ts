import { IconName } from '@/shared/components/Icon';

export const SETTINGS_MESSAGES = {
  LOAD_ERROR: 'Không thể tải cài đặt:',
  SAVE_SUCCESS: 'Đã lưu thông tin công ty thành công!',
  SAVE_ERROR: 'Lỗi:',
  DEFAULT_ROLE_HINT:
    'Vai trò này sẽ được tự động gán cho những tài khoản mới đăng ký qua hệ thống.',
  ERR_COMPANY_NAME_MIN: 'Tên công ty tối thiểu 2 ký tự',
  ERR_ADDRESS_MIN: 'Nhập địa chỉ',
  ERR_EMAIL_INVALID: 'Email không hợp lệ',
} as const;

export const SETTINGS_LABELS = {
  PAGE_TITLE: 'Cài đặt hệ thống',
  PAGE_SUBTITLE: 'Quản lý cấu hình công ty và các tham số vận hành.',
  COMPANY_INFO_TITLE: 'Thông tin công ty',
  SYSTEM_DISPLAY_TITLE: 'Hiển thị hệ thống',
  FLUID_LAYOUT_LABEL: 'Chế độ tràn viền (Fluid Dashboard)',
  FLUID_LAYOUT_DESC:
    'Bật công tắc này để giao diện mở rộng 100% diện tích màn hình.',
  COMPANY_NAME: 'Tên công ty',
  TAX_CODE: 'Mã số thuế',
  ADDRESS: 'Địa chỉ',
  PHONE: 'Số điện thoại',
  EMAIL: 'Email',
  WEBSITE: 'Website',
  LOGO_URL: 'Link logo',
  BANK_NAME: 'Tên ngân hàng',
  BANK_ACCOUNT: 'Số tài khoản',
  DEFAULT_USER_ROLE: 'Vai trò mặc định cho người dùng mới',
  BTN_UNDO: 'Hoàn tác',
  BTN_SAVING: 'Đang lưu...',
  BTN_SAVE: 'Lưu thông tin',
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
