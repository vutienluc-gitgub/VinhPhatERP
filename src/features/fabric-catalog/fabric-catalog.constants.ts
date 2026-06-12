export const ROUTE_FABRIC_CATALOG = '/fabric-catalog';

export const LABELS = {
  SEARCH_PLACEHOLDER: 'Tên, mã, thành phần...',
  SEARCH: 'Tìm kiếm',
  STATUS: 'Trạng thái',
  CODE: 'Mã',
  NAME: 'Tên loại vải',
  CATEGORY: 'Nhóm vải',
  CATEGORY_PLACEHOLDER: 'Chọn nhóm vải...',
  COMPOSITION: 'Thành phần',
  COMPOSITION_PLACEHOLDER: 'VD: Cotton...',
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
  BACK_TO_LIST: 'Danh mục vải',
  NOT_FOUND: 'Không tìm thấy loại vải hoặc có lỗi xảy ra.',
  BACK: 'Quay lại danh sách',
  NA: '—',
} as const;

export const MESSAGES = {
  CONFIRM_DELETE: (name: string) =>
    `Xóa loại vải "${name}"? Hành động này không thể hoàn tác.`,
} as const;

export const HOTLINE = '0989072670';

export const PUBLIC_PAGE_LABELS = {
  loading: 'Đang tải thông tin...',
  notFound: 'Không tìm thấy mẫu vải',
  notFoundDesc: 'Mẫu vải không tồn tại hoặc đã ngừng kinh doanh.',
  backHome: 'Về trang chủ',
  callNow: 'Gọi ngay',
  zaloQuote: 'Nhận báo giá',
  zaloMsgPrefix: 'Tôi muốn nhận báo giá mẫu vải',
  composition: 'Thành phần',
  specs: 'Quy cách',
  weavePattern: 'Kiểu dệt',
  machineType: 'Kỹ thuật',
  fabricType: 'Nhóm vải',
  knitted: 'Dệt kim',
  woven: 'Dệt thoi',
  noImage: 'Chưa có hình ảnh',
  width: 'Khổ',
  gsm: 'Định lượng',
} as const;
