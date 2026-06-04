export const LABELS = {
  SEARCH_PLACEHOLDER: 'Tên, mã, thành phần...',
  SEARCH: 'Tìm kiếm',
  STATUS: 'Trạng thái',
  CODE: 'Mã',
  NAME: 'Tên loại vải',
  COMPOSITION: 'Thành phần',
  SPECS: 'Quy cách (chuẩn)',
  WIDTH: 'Khổ',
  GSM: 'K/L',
  UNIT: 'Đơn vị',
  ACTIONS: 'Thao tác',
  EDIT: 'Chỉnh sửa',
  PRINT_QR: 'In Tem Mẫu',
  DELETE: 'Xóa',
  ADD_NEW: 'Thêm loại vải',
  TOTAL_CATALOGS: 'Tổng loại vải',
  TOTAL_CATALOGS_DESC: 'Toàn bộ danh mục hệ thống',
  ACTIVE: 'Đang hoạt động',
  ACTIVE_DESC: 'Trên trang hiện tại',
  MAIN_COMPOSITION: 'Thành phần chính',
  MAIN_COMPOSITION_DESC: 'Được ưa chuộng nhất',
  EMPTY_SEARCH: 'Không tìm thấy loại vải phù hợp',
  EMPTY_LIST: 'Chưa có loại vải nào',
  ADD_NEW_BTN: '+ Thêm loại vải',
  ITEM_LABEL: 'loại vải',
  NA: '—',
} as const;

export const MESSAGES = {
  CONFIRM_DELETE: (name: string) =>
    `Xóa loại vải "${name}"? Hành động này không thể hoàn tác.`,
} as const;
