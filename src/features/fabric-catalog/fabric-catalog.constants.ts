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
  TAB_GALLERY: 'Thư viện ảnh',
  TAB_ADMIN: 'Quản trị',

  // Gallery UX
  GALLERY_TITLE: 'Thư viện ảnh sản phẩm',
  GALLERY_DESC: 'Kéo thả hoặc tải lên các ảnh chi tiết cho mẫu vải này.',
  GALLERY_UPLOAD: 'Tải ảnh lên',
  GALLERY_EMPTY: 'Chưa có ảnh nào trong thư viện',
  GALLERY_EMPTY_HINT: 'Nhấn Tải ảnh lên để bắt đầu',
  GALLERY_SEO_WARNING: 'Khuyến nghị SEO & Trải nghiệm khách hàng:',
  GALLERY_WARNING_SWATCH: 'Nên có ít nhất 1 ảnh Mẫu vải (SWATCH)',
  GALLERY_WARNING_SURFACE: 'Nên có ít nhất 1 ảnh Chi tiết bề mặt (SURFACE)',
  GALLERY_WARNING_APPLICATION:
    'Nên có ít nhất 1 ảnh Ứng dụng/Góc gấp (APPLICATION)',
  GALLERY_IMAGE_TYPE: 'Loại ảnh',
  GALLERY_IMAGE_POS: 'Vị trí',
  GALLERY_ALT_TEXT: 'Alt Text (SEO)',
  GALLERY_CAPTION: 'Caption',
  GALLERY_IS_PRIMARY: 'Ảnh chính',
  GALLERY_REMOVE_IMAGE: 'Xóa ảnh',
  GALLERY_ALT_PLACEHOLDER: 'VD: Vải nỉ bông màu xám...',
  GALLERY_CAPTION_PLACEHOLDER: 'VD: Chi tiết bề mặt sợi dệt...',
  GALLERY_DEFAULT_ALT: 'Ảnh mẫu vải',
  GALLERY_UPLOADING: 'Đang tải lên...',

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
    'Xin chào,\nTôi muốn nhận báo giá:\n- Mã vải: {code}\n- Tên: {name}\n- Màu: {color}\n- MOQ: {moq}\nVui lòng tư vấn giúp.',
  zaloSampleMsg:
    'Xin chào,\nTôi muốn nhận mẫu:\n- Mã vải: {code}\n- Tên: {name}\n- Màu: {color}\nVui lòng hướng dẫn thủ tục nhận mẫu.',
  composition: 'Thành phần',
  specs: 'Quy cách kỹ thuật',
  specsCommercial: 'Thông tin thương mại',
  weavePattern: 'Kiểu dệt',
  machineType: 'Kỹ thuật',
  fabricType: 'Nhóm vải',
  knitted: 'Dệt kim',
  woven: 'Dệt thoi',
  noImage: 'Chưa có hình ảnh',
  width: 'Khổ rộng',
  gsm: 'Định lượng',
  stretch: 'Co giãn',
  thickness: 'Độ dày',
  applications: 'Ứng dụng may mặc',
  characteristics: 'Đặc tính nổi bật',
  moq: 'MOQ tiêu chuẩn',
  moqStock: 'MOQ hàng sẵn',
  moqCustom: 'MOQ đặt sản xuất',
  leadTime: 'Thời gian giao hàng',
  leadTimeStock: 'Thời gian giao hàng sẵn',
  leadTimeCustom: 'Thời gian sản xuất',
  relatedProducts: 'Có thể bạn quan tâm',
  alsoViewedProducts: 'Khách hàng khác cũng xem',
  viewCountPrefix: 'Đã xem bởi',
  viewCountSuffix: 'khách hàng',
  colorViewing: 'Màu đang xem:',
  brandName: 'Vĩnh Phát Textile',
  colorSectionTitle: 'Bảng màu & Biến thể',
  na: 'N/A',
  unitCm: 'cm',
  unitGsm: 'gsm',
  noImageIcon: '📸',
  origin: 'Xuất xứ',
  sampleStatusLabel: 'Tình trạng mẫu',
  stockStatusLabel: 'Tình trạng hàng',
  copiedLink: 'Đã sao chép liên kết chia sẻ!',
  shareTitle: 'Chia sẻ mẫu vải',
  wishlistTitle: 'Danh sách lưu mẫu vải',
  wishlistEmpty: 'Chưa lưu mẫu vải nào.',
  wishlistBatchRequest: 'Yêu cầu gửi mẫu cả danh sách',
  compareTitle: 'So sánh thông số vải',
  compareEmpty: 'Chọn từ 2 mẫu vải trở lên để tiến hành so sánh.',
  compareLimit: 'Chỉ có thể so sánh tối đa 3 mẫu vải cùng lúc.',
  requestSampleTitle: 'Yêu cầu nhận mẫu vải',
  requestSampleDesc:
    'Vĩnh Phát hỗ trợ gửi mẫu vải miễn phí (Khổ A4/Bản cắt) cho doanh nghiệp và xưởng may.',
  contactNameLabel: 'Họ và tên người nhận',
  contactPhoneLabel: 'Số điện thoại liên hệ',
  contactAddressLabel: 'Địa chỉ nhận mẫu',
  companyNameLabel: 'Tên công ty / Thương hiệu (nếu có)',
  submitRequest: 'Gửi yêu cầu nhận mẫu',
  requestSuccess:
    'Gửi yêu cầu nhận mẫu thành công! Nhân viên Vĩnh Phát sẽ liên hệ xác nhận sớm nhất.',
  requestPending: 'Đang xử lý...',
  saveWishlist: 'Lưu mẫu',
  savedWishlist: 'Đã lưu',
  addToCompare: 'So sánh',
  addedCompare: 'Đã thêm',
  clearAll: 'Xóa tất cả',
  close: 'Đóng',
  volumePricing: 'Bảng giá sỉ & Đại lý',
  pricingTierColQty: 'Số lượng (kg)',
  pricingTierColPrice: 'Đơn giá / kg',
  calculatorTitle: 'Bộ công cụ dự toán chi phí B2B',
  calculatorQtyLabel: 'Nhập số lượng cần mua (kg)',
  calculatorEstPrice: 'Đơn giá dự toán:',
  calculatorEstTotal: 'Tổng chi phí ước tính:',
  calculatorMoqWarning:
    '⚠️ Số lượng dưới mức MOQ ({moq} kg) cho biến thể màu này!',
  rfqBtn: 'Yêu cầu báo giá',
  rfqModalTitle: 'Yêu cầu báo giá chính thức',
  rfqModalDesc:
    'Vui lòng cung cấp thông tin liên hệ và số lượng mong muốn để nhận bảng báo giá chi tiết kèm chiết khấu tốt nhất.',
  rfqTargetPriceLabel: 'Giá kỳ vọng (đ/kg, nếu có)',
  rfqDeliveryDateLabel: 'Ngày mong muốn giao hàng',
  rfqEmailLabel: 'Địa chỉ Email liên hệ',
  rfqSuccess:
    'Gửi yêu cầu báo giá thành công! Đội ngũ Sales sẽ gửi file báo giá chính thức trong vòng 24 giờ.',
  noPricingTiersDesc:
    'Liên hệ bộ phận Sales của Vĩnh Phát để nhận báo giá sỉ & chiết khấu đại lý tốt nhất.',
  contactQuote: 'Liên hệ',
  fabricDetailHeader: 'CHI TIẾT VẢI:',
  requestedQty: 'Số lượng yêu cầu:',
  validationNameRequired: 'Họ tên là bắt buộc',
  validationPhoneRequired: 'Số điện thoại là bắt buộc',
  validationQtyInvalid: 'Số lượng phải là số',
  validationQtyPositive: 'Số lượng phải lớn hơn 0',
  validationEmailInvalid: 'Email không đúng định dạng',
  validationTargetPricePositive: 'Giá kỳ vọng phải lớn hơn 0',
} as const;

export const IMAGE_TYPE_MAP: Record<string, string> = {
  SWATCH: 'Mẫu vải',
  SURFACE: 'Chi tiết sợi',
  BACK: 'Mặt trái',
  STRETCH: 'Độ co giãn',
  APPLICATION: 'Ứng dụng',
  COMPOSITION: 'Thành phần',
  CERTIFICATE: 'Chứng nhận',
};

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

export const LEAD_TIME_UNIT_MAP: Record<string, string> = {
  day: 'ngày',
  week: 'tuần',
  month: 'tháng',
  DAY: 'ngày',
  WEEK: 'tuần',
  MONTH: 'tháng',
};
