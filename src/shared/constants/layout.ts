export const APP_SHELL_LABELS = {
  BRAND_NAME: 'Vĩnh Phát',
  SEARCH_PLACEHOLDER: 'Tìm kiếm nhanh (Ctrl+K)',
  SEARCH: 'Tìm kiếm',
  SEARCH_KBD: 'Ctrl K',
  CALCULATOR_TITLE: 'Máy tính giá mộc (Costing Studio)',
  CALCULATOR: 'Tính giá',
  INBOX: 'Hộp thư',
  LOGOUT: 'Đăng xuất',
  HOME: 'Tổng quan',
  QUICK_CREATE: 'Tạo mới nhanh',
  APPS: 'Ứng dụng',
  GUIDE_TITLE: 'Sổ tay / Hướng dẫn sử dụng',
  GUIDE: 'Sổ tay',
  THEME_LIGHT: 'Chế độ Sáng',
  THEME_DARK: 'Chế độ Tối',
  MENU: 'Menu',
  QUICK_CREATE_TITLE_PREFIX: 'Tạo mới',
  QUICK_CREATE_DEV_TITLE: 'Đang xây dựng Form',
  QUICK_CREATE_DEV_DESC:
    'Tính năng Tạo mới {action} trực tiếp qua Popup đang được phát triển. Form nhập liệu sẽ sớm có mặt tại đây.',
  APP_LAUNCHER_TITLE: 'Trình khởi chạy ứng dụng',
};

export const QUICK_ACTIONS = [
  { label: 'Nhập Sợi', icon: 'PackageOpen', path: '/yarn-receipts' },
  { label: 'Nhập Mộc', icon: 'Box', path: '/raw-fabric' },
  { label: 'Nhập Vải', icon: 'Layers', path: '/finished-fabric' },
  { label: 'Xuất Vải', icon: 'Truck', path: '/shipments' },
  { label: 'Phiếu chi', icon: 'Receipt', path: '/payments' },
] as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
  driver: 'Tài xế',
  viewer: 'Viewer',
  sale: 'Sale',
  customer: 'Khách hàng',
};

export const NOTIFICATION_BELL_LABELS = {
  TITLE: 'Thông báo mới',
  EMPTY: 'Bạn không có thông báo mới nào',
  NEW_ORDER_TOAST: 'Có yêu cầu đặt hàng mới mã {orderNumber}!',
  NEW_ORDER_WAITING: 'Yêu cầu đặt hàng chờ duyệt',
  TIME_PREFIX: 'Khoảng',
  CUSTOMER_PREFIX: 'Khách hàng',
  UNKNOWN_CUSTOMER: 'Một khách hàng',
  ORDER_DESC:
    'vừa tạo yêu cầu đặt hàng mã {orderNumber}. Vui lòng kiểm tra và duyệt!',
  SEE_MORE: 'Xem thêm',
  MARK_ALL_READ: 'Đánh dấu tất cả đã đọc',
};

export const DRAWER_LABELS = {
  HEADER_TITLE: 'Tất cả chức năng',
  SEARCH_PLACEHOLDER: 'Tìm module...',
  EMPTY: 'Không tìm thấy module nào',
  OTHER_GROUP: 'Khác',
  CLEAR_SEARCH_ARIA: 'Xóa tìm kiếm',
  MODAL_ARIA: 'Tất cả module',
};

export const PROMO_MESSAGES = {
  TITLE: 'Nâng cấp tính năng AI',
  BTN_UPGRADE: 'Nâng cấp ngay',
};
