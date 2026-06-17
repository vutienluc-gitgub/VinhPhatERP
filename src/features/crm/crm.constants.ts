export const LEAD_STATUS_MAP: Record<
  string,
  { label: string; dot: string; colorClass: string }
> = {
  NEW: {
    label: 'Mới tạo',
    dot: '🔵',
    colorClass: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  CONTACTED: {
    label: 'Đã liên hệ',
    dot: '🟡',
    colorClass: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  SAMPLE_SENT: {
    label: 'Đã gửi mẫu',
    dot: '🟣',
    colorClass: 'bg-purple-50 text-purple-700 border-purple-100',
  },
  QUOTED: {
    label: 'Đã báo giá',
    dot: '🟠',
    colorClass: 'bg-orange-50 text-orange-700 border-orange-100',
  },
  NEGOTIATING: {
    label: 'Đang thương lượng',
    dot: '🟤',
    colorClass: 'bg-stone-50 text-stone-700 border-stone-100',
  },
  WON: {
    label: 'Thành công',
    dot: '🟢',
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  LOST: {
    label: 'Thất bại',
    dot: '🔴',
    colorClass: 'bg-red-50 text-red-700 border-red-100',
  },
};

export const LEAD_TYPE_MAP: Record<
  string,
  { label: string; colorClass: string }
> = {
  RFQ: { label: 'Yêu cầu Báo giá', colorClass: 'bg-blue-100 text-blue-800' },
  SAMPLE: {
    label: 'Yêu cầu Gửi mẫu',
    colorClass: 'bg-purple-100 text-purple-800',
  },
  CONTACT: { label: 'Liên hệ', colorClass: 'bg-slate-100 text-slate-800' },
};

export const ACTIVITY_TYPE_MAP: Record<
  string,
  { label: string; icon: string; colorClass: string }
> = {
  CALL: {
    label: 'Gọi điện',
    icon: 'Phone',
    colorClass: 'text-blue-600 bg-blue-50',
  },
  NOTE: {
    label: 'Ghi chú',
    icon: 'StickyNote',
    colorClass: 'text-amber-600 bg-amber-50',
  },
  EMAIL: {
    label: 'Gửi Email',
    icon: 'Mail',
    colorClass: 'text-purple-600 bg-purple-50',
  },
  SAMPLE: {
    label: 'Gửi mẫu',
    icon: 'Package',
    colorClass: 'text-emerald-600 bg-emerald-50',
  },
  QUOTE: {
    label: 'Báo giá',
    icon: 'FileText',
    colorClass: 'text-indigo-600 bg-indigo-50',
  },
  ORDER: {
    label: 'Tạo đơn hàng',
    icon: 'ShoppingCart',
    colorClass: 'text-green-600 bg-green-50',
  },
  SYSTEM: {
    label: 'Hệ thống',
    icon: 'Settings',
    colorClass: 'text-slate-600 bg-slate-50',
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
