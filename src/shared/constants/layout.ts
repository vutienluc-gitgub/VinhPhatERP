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
};

export const QUICK_ACTIONS = [
  { label: 'Nhập Sợi', icon: 'PackageOpen', path: '/yarn-receipts' },
  { label: 'Nhập Mộc', icon: 'Box', path: '/raw-fabric' },
  { label: 'Nhập Vải', icon: 'Layers', path: '/finished-fabric' },
  { label: 'Xuất Vải', icon: 'Truck', path: '/shipments' },
  { label: 'Phiếu chi', icon: 'Receipt', path: '/payments' },
] as const;
