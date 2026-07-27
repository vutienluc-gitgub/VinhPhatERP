export const LEAD_STATUS_MAP: Record<
  string,
  { label: string; dot: string; colorClass: string }
> = {
  NEW: {
    label: 'Mới tạo',
    dot: '🔵',
    colorClass: 'bg-blue-50 text-info border-info',
  },
  CONTACTED: {
    label: 'Đã liên hệ',
    dot: '🟡',
    colorClass: 'bg-amber-50 text-warning-strong border-warning',
  },
  SAMPLE_SENT: {
    label: 'Đã gửi mẫu',
    dot: '🟣',
    colorClass: 'bg-purple-50 text-purple-700 border-purple-100',
  },
  QUOTED: {
    label: 'Đã báo giá',
    dot: '🟠',
    colorClass: 'bg-orange-50 text-warning-strong border-warning',
  },
  NEGOTIATING: {
    label: 'Đang thương lượng',
    dot: '🟤',
    colorClass: 'bg-stone-50 text-stone-700 border-stone-100',
  },
  WON: {
    label: 'Thành công',
    dot: '🟢',
    colorClass: 'bg-emerald-50 text-success border-success',
  },
  LOST: {
    label: 'Thất bại',
    dot: '🔴',
    colorClass: 'bg-red-50 text-danger border-danger',
  },
  CONVERTED: {
    label: 'Đã chuyển đổi',
    dot: '✅',
    colorClass: 'bg-teal-50 text-success border-success',
  },
};

export const LEAD_TYPE_MAP: Record<
  string,
  { label: string; colorClass: string }
> = {
  RFQ: { label: 'Yêu cầu Báo giá', colorClass: 'bg-info-soft text-info' },
  SAMPLE: {
    label: 'Yêu cầu Gửi mẫu',
    colorClass: 'bg-purple-100 text-purple-800',
  },
  CONTACT: {
    label: 'Liên hệ',
    colorClass: 'bg-surface-secondary text-primary',
  },
};

export const ACTIVITY_TYPE_MAP: Record<
  string,
  { label: string; icon: string; colorClass: string }
> = {
  CALL: {
    label: 'Gọi điện',
    icon: 'Phone',
    colorClass: 'text-info bg-blue-50',
  },
  NOTE: {
    label: 'Ghi chú',
    icon: 'StickyNote',
    colorClass: 'text-warning bg-amber-50',
  },
  EMAIL: {
    label: 'Gửi Email',
    icon: 'Mail',
    colorClass: 'text-purple-600 bg-purple-50',
  },
  SAMPLE: {
    label: 'Gửi mẫu',
    icon: 'Package',
    colorClass: 'text-success bg-emerald-50',
  },
  QUOTE: {
    label: 'Báo giá',
    icon: 'FileText',
    colorClass: 'text-info bg-indigo-50',
  },
  ORDER: {
    label: 'Tạo đơn hàng',
    icon: 'ShoppingCart',
    colorClass: 'text-success bg-green-50',
  },
  SYSTEM: {
    label: 'Hệ thống',
    icon: 'Settings',
    colorClass: 'text-muted bg-slate-50',
  },
};

export const CRM_LABELS = {
  LIST_HEADER_CUSTOMER: 'Khách hàng',
  LIST_HEADER_CONTACT: 'Liên hệ',
  LIST_HEADER_TYPE: 'Loại yêu cầu',
  LIST_HEADER_DETAILS: 'Chi tiết Yêu cầu',
  LIST_HEADER_STATUS: 'Trạng thái',
  LIST_HEADER_CREATED: 'Ngày tạo',
  EMPTY_TITLE: 'Chưa có khách hàng tiềm năng nào',
  EMPTY_DESC:
    'Danh sách này sẽ hiển thị các yêu cầu báo giá và yêu cầu mẫu vải.',
  ITEM_LABEL: 'yêu cầu',
  EMPTY_TEXT: '-',
};

export const LEAD_DETAIL_MESSAGES = {
  NOT_FOUND: 'Không tìm thấy thông tin Lead.',
  STATUS_LABEL: 'Trạng thái:',
  CONTACT_INFO: 'Thông tin liên hệ',
  PHONE: 'Số điện thoại',
  CALL_NOW: 'Gọi ngay',
  EMAIL: 'Email',
  NOT_AVAILABLE: 'Chưa có',
  RFQ_DETAIL_TITLE: 'Chi tiết Yêu cầu Báo giá',
  EXPECTED_PRICE: 'Giá kỳ vọng',
  PRODUCT: 'Sản phẩm',
  COLOR_VARIANT: 'Màu sắc/Biến thể',
  QUANTITY: 'Số lượng',
  CREATE_QUOTE_BTN: 'Tạo Báo giá chính thức',
  SAMPLE_DETAIL_TITLE: 'Chi tiết Gửi mẫu',
  BULK_SAMPLE_REQ: 'Mẫu vải yêu cầu (Hàng loạt)',
  ALL_COLORS: 'Tất cả màu',
  SAMPLE_REQ: 'Mẫu vải yêu cầu',
  COLORS_REQ: 'Các màu yêu cầu',
  DELIVERY_ADDRESS: 'Địa chỉ nhận mẫu',
};
