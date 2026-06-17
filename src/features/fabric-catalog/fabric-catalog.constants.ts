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

  // Form tabs
  TAB_INFO: 'Thông tin',
  TAB_PUBLIC: 'Công khai',
  TAB_ADMIN: 'Quản trị',

  // Slug UX
  SLUG_LABEL: 'Đường dẫn tĩnh (Slug)',
  SLUG_AUTO_HINT: 'Tự động tạo từ mã vải',
  SLUG_EDIT: 'Sửa',
  SLUG_CANCEL: 'Hủy',

  // Public toggle
  PUBLIC_TITLE: 'Công khai cho khách hàng',
  PUBLIC_DESC: 'Khách hàng có thể quét QR và xem thông tin trực tuyến',
  PUBLIC_ON: 'Đang công khai',
  PUBLIC_OFF: 'Chưa công khai',
  PUBLIC_PAGE_LABEL: 'Trang công khai',

  // Preview card
  PREVIEW_TITLE: 'Xem trước trang công khai',
  PREVIEW_NO_IMAGE: 'Chưa có ảnh',
  PREVIEW_WIDTH_UNIT: 'cm',
  PREVIEW_GSM_UNIT: 'gsm',

  // Tag inputs
  OLD_DATA_HINT: 'Dữ liệu cũ: ',
  COMPOSITION_TAG_PLACEHOLDER: 'VD: 65% Polyester, 35% Cotton (Nhấn Enter)',
  COLOR_TAG_PLACEHOLDER: 'VD: Trắng, Đen (Nhấn Enter)',
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
  callNow: 'Gọi',
  zaloQuote: 'Báo giá',
  zaloSample: 'Gửi mẫu',
  zaloQuoteMsg:
    'Xin chào,\nTôi muốn nhận báo giá:\n{code}\n{name}\nVui lòng tư vấn giúp.',
  zaloSampleMsg:
    'Xin chào,\nTôi muốn nhận mẫu:\n{code}\n{name}\nVui lòng hướng dẫn thủ tục nhận mẫu.',
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
  stretch: 'Co giãn',
  thickness: 'Độ dày',
  applications: 'Ứng dụng',
  characteristics: 'Đặc tính',
  moq: 'MOQ',
  leadTime: 'Lead time',
  relatedProducts: 'Có thể bạn quan tâm',
  viewCountPrefix: 'Đã xem bởi',
  viewCountSuffix: 'khách hàng',
  colorViewing: 'Màu đang xem:',
  brandName: 'Vĩnh Phát Textile',
  colorSectionTitle: 'Màu sắc',
  na: 'N/A',
  unitCm: 'cm',
  unitGsm: 'gsm',
  noImageIcon: '📸',
} as const;

export const STRETCH_TYPE_MAP: Record<string, string> = {
  NONE: 'Không co giãn',
  HORIZONTAL: 'Co giãn ngang',
  VERTICAL: 'Co giãn dọc',
  TWO_WAY: 'Co giãn 2 chiều',
  FOUR_WAY: 'Co giãn 4 chiều',
};

export const THICKNESS_MAP: Record<string, string> = {
  THIN: 'Mỏng',
  MEDIUM: 'Trung bình',
  THICK: 'Dày',
  EXTRA_THICK: 'Rất dày',
};

export const STOCK_STATUS_MAP: Record<string, { label: string; dot: string }> =
  {
    SAMPLE_AVAILABLE: { label: 'Có sẵn mẫu', dot: '🟢' },
    READY_STOCK: { label: 'Có sẵn hàng', dot: '🔵' },
    CUSTOM_ORDER: { label: 'Dệt theo yêu cầu', dot: '🟡' },
    OUT_OF_STOCK: { label: 'Tạm hết hàng', dot: '🔴' },
  };

export const LEAD_TIME_UNIT_MAP: Record<string, string> = {
  DAY: 'ngày',
  WEEK: 'tuần',
  MONTH: 'tháng',
};
