export const FABRIC_CATALOG_TEXT = {
  PAGE_TITLE: 'Danh mục sản phẩm',
  PAGE_SUBTITLE: 'Khám phá các loại vải và mã hàng Vĩnh Phát đang cung cấp',
  SEARCH_PLACEHOLDER: 'Tìm sản phẩm, thành phần...',
  ERROR_LOAD_FAILED: 'Lỗi tải danh mục:',
  EMPTY_STATE_TITLE: 'Không tìm thấy loại vải nào',
  EMPTY_STATE_DESC: 'Vui lòng thử tìm kiếm với các từ khóa khác.',
  ITEM_LABEL: 'sản phẩm',

  // Columns
  COL_CODE: 'Mã vải',
  COL_NAME: 'Tên loại vải',
  COL_SPEC: 'Quy cách (chuẩn)',
  COL_UNIT: 'Đơn vị',
  COL_FEATURES: 'Đặc tính',
  COL_ACTIONS: 'Thao tác',

  // Field labels & badges
  LABEL_WIDTH_PREFIX: 'Khổ:',
  LABEL_GSM_PREFIX: 'K/L:',
  LABEL_WIDTH_STD: 'Khổ chuẩn',
  LABEL_GSM_STD: 'K/L chuẩn',
  LABEL_REQUEST_ORDER: 'Yêu cầu đặt',
  LABEL_REQUEST: 'Yêu cầu',
  LABEL_PREMIUM: 'Premium',
  LABEL_AVAILABLE: 'Có sẵn',
  LABEL_UPDATING_COMPOSITION: 'Đang cập nhật thành phần...',
  LABEL_UNKNOWN_COMPOSITION: 'Chưa rõ thành phần',
  LABEL_DEFAULT_CATEGORY: 'Vải',
  FALLBACK_EMPTY: '—',

  // Contact banner
  BANNER_TITLE: 'Yêu cầu báo giá đặc biệt?',
  BANNER_DESC:
    'Nếu bạn không tìm thấy mã vải mong muốn hoặc cần đặt sản xuất theo yêu cầu, vui lòng liên hệ trực tiếp với nhân viên kinh doanh của Vĩnh Phát để được hỗ trợ.',
  BANNER_BUTTON: 'Liên hệ ngay',
} as const;

export function getPrimaryComposition(composition?: string | null): string {
  if (!composition || !composition.trim()) {
    return FABRIC_CATALOG_TEXT.LABEL_DEFAULT_CATEGORY;
  }
  const parts = composition.split('/');
  return parts[0]?.trim() || FABRIC_CATALOG_TEXT.LABEL_DEFAULT_CATEGORY;
}

export function formatSpecValue(
  value?: number | null,
  unit: string = '',
): string {
  if (value === null || value === undefined || value === 0) {
    return FABRIC_CATALOG_TEXT.FALLBACK_EMPTY;
  }
  return `${value} ${unit}`.trim();
}
