import type { BadgeVariant } from '@/shared/components/Badge';

/** Centralized labels for the Debt module to avoid hardcoded Vietnamese strings. */
export const DEBT_LABELS = {
  customer: {
    kpiTitle: 'Tổng công nợ phải thu',
    kpiFooter: (count: number) => `Từ ${count} khách hàng còn nợ`,
    kpiIcon: 'TrendingUp',
    countLabel: 'Số khách hàng đang nợ',
    countIcon: 'Users',
    countFooter: 'Cần theo dõi và đôn đốc thu hồi',
    emptyTitle: 'Không có công nợ khách hàng',
    emptyDescription: 'Tất cả đơn hàng đã được thanh toán đầy đủ.',
    totalLabel: 'Tổng đặt',
    paidLabel: 'Đã thu',
    progressLabel: 'Tiến độ thu tiền',
    docUnit: 'đơn',
  },
  supplier: {
    kpiTitle: 'Tổng phải trả nhà cung cấp',
    kpiFooter: (count: number) => `Cần thanh toán cho ${count} nhà cung cấp`,
    kpiIcon: 'TrendingDown',
    countLabel: 'Nhà cung cấp chờ thanh toán',
    countIcon: 'Building2',
    countFooter: 'Ưu tiên thanh toán sớm để duy trì quan hệ',
    emptyTitle: 'Không có công nợ nhà cung cấp',
    emptyDescription: 'Tất cả phiếu nhập đã được thanh toán đầy đủ.',
    totalLabel: 'Tổng mua',
    paidLabel: 'Đã trả',
    progressLabel: 'Tiến độ thanh toán',
    docUnit: 'phiếu',
  },
} as const;

export const EXPENSE_FORM_LABELS = {
  titleEdit: 'Sửa phiếu chi:',
  titleCreate: 'Tạo phiếu chi mới',
  cancel: 'Hủy',
  submitEdit: 'Cập nhật',
  submitCreate: 'Tạo phiếu chi',
  errorPrefix: 'Lỗi:',
  expenseNumber: 'Số phiếu chi',
  expenseNumberAuto: 'Tự động',
  expenseDate: 'Ngày chi',
  category: 'Danh mục',
  amount: 'Số tiền (đ)',
  amountPlaceholder: 'VD: 5.000.000',
  supplierId: 'Nhà cung cấp / Đối tác',
  supplierPlaceholder: '— Chọn nhà cung cấp —',
  description: 'Mô tả',
  descriptionPlaceholder: 'VD: Thanh toán tiền sợi tháng 3',
  accountId: 'Tài khoản chi',
  accountIdPlaceholder: '— Không chọn —',
  referenceNumber: 'Số chứng từ',
  referenceNumberPlaceholder: 'Mã giao dịch, số hóa đơn...',
  employeeId: 'Nhân viên phụ trách',
  employeeIdPlaceholder: '— Không chọn —',
  notes: 'Ghi chú',
  notesPlaceholder: 'Ghi chú thêm...',
} as const;

export const PAYMENT_FORM_LABELS = {
  titlePrefix: 'Thu tiền —',
  cancel: 'Hủy',
  submitReady: 'Xác nhận thu',
  submitPending: 'Đang lưu...',
  errorPrefix: 'Lỗi:',
  balanceDuePrefix: 'Còn nợ:',
  paymentNumber: 'Số phiếu thu',
  paymentNumberAuto: 'Tự động',
  paymentDate: 'Ngày thu',
  amount: 'Số tiền (đ)',
  amountPlaceholder: 'VD: 5.000.000',
  paymentMethod: 'Hình thức',
  referenceNumber: 'Số chứng từ / mã giao dịch',
  referenceNumberPlaceholder: 'Số séc, mã giao dịch...',
} as const;

export const ACCOUNT_FORM_LABELS = {
  titleEdit: 'Sửa:',
  titleCreate: 'Thêm tài khoản mới',
  cancel: 'Hủy',
  submitEdit: 'Cập nhật',
  submitCreate: 'Tạo tài khoản',
  errorPrefix: 'Lỗi:',
  name: 'Tên tài khoản',
  namePlaceholder: 'VD: VCB - Vĩnh Phát',
  type: 'Loại tài khoản',
  bankName: 'Tên ngân hàng',
  bankNamePlaceholder: 'VD: Vietcombank',
  accountNumber: 'Số tài khoản',
  accountNumberPlaceholder: 'VD: 1234567890',
  initialBalance: 'Số dư ban đầu (đ)',
  status: 'Trạng thái',
  notes: 'Ghi chú',
  notesPlaceholder: 'Ghi chú thêm...',
} as const;

/** Badge mapping per debt risk tier → shared Badge component variant */
export const DEBT_RISK_TIER_BADGE: Record<
  string,
  { label: string; variant: BadgeVariant } | null
> = {
  none: null,
  normal: { label: 'Còn nợ', variant: 'gray' },
  warning: { label: 'Cảnh báo', variant: 'warning' },
  danger: { label: 'Nợ rủi ro', variant: 'danger' },
};

/** Human-readable labels for payment account statuses. */
export const ACCOUNT_STATUS_LABELS: Record<'active' | 'inactive', string> = {
  active: 'Hoạt động',
  inactive: 'Ngừng sử dụng',
};

/** Options array for use in Combobox / select inputs. */
export const ACCOUNT_STATUS_OPTIONS = [
  { value: 'active' as const, label: ACCOUNT_STATUS_LABELS.active },
  { value: 'inactive' as const, label: ACCOUNT_STATUS_LABELS.inactive },
];

export const ACCOUNT_MESSAGES = {
  TITLE: 'Tài Khoản Thanh Toán',
  SUBTITLE: 'Quản lý quỹ tiền mặt và ngân hàng',
  SHOW_INACTIVE: 'Hiện ngừng dùng',
  BTN_ADD: 'Thêm tài khoản',
  KPI_TOTAL_BALANCE: 'Tổng số dư tất cả tài khoản',
  KPI_TOTAL_FOOTER: (count: number) => `${count} tài khoản đang theo dõi`,
  KPI_ACTIVE_ACCOUNTS: 'Tài khoản hoạt động',
  KPI_ACTIVE_FOOTER: 'Đang sử dụng',
  ERROR_LOAD: 'Lỗi tải dữ liệu: ',
  ERROR_DELETE: 'Lỗi xóa tài khoản: ',
  EXPORT_FILENAME: 'tai-khoan-thanh-toan',
  EMPTY_TITLE: 'Chưa có tài khoản nào',
  EMPTY_DESC:
    'Nhấn "+ Thêm tài khoản" để bắt đầu quản lý quỹ tiền mặt và ngân hàng.',
  EMPTY_ACTION: '+ Thêm tài khoản',
  DELETE_CONFIRM: (name: string) =>
    `Xóa tài khoản "${name}"? Chỉ xóa được nếu chưa có giao dịch liên kết.`,
  COL_ACCOUNT: 'Tên tài khoản',
  COL_BANK_INFO: 'Ngân hàng / Số TK',
  COL_INITIAL_BALANCE: 'Số dư ban đầu',
  COL_BALANCE: 'Số dư hiện tại',
  COL_STATUS: 'Trạng thái',
  COL_ACTIONS: 'Thao tác',
  BTN_EDIT_TITLE: 'Sửa',
  BTN_DELETE_TITLE: 'Xóa',
} as const;

export const EXPENSE_MESSAGES = {
  TITLE: 'Phiếu Chi',
  SUBTITLE: 'Quản lý các khoản chi phí',
  BTN_ADD: 'Tạo phiếu chi',
  FILTER_SEARCH_LABEL: 'Tìm kiếm',
  FILTER_SEARCH_PLACEHOLDER: 'Số phiếu, mô tả...',
  FILTER_CATEGORY: 'Danh mục',
  FILTER_DATE: 'Thời gian chi',
  ERROR_LOAD: 'Lỗi tải dữ liệu: ',
  ERROR_DELETE: 'Lỗi xóa phiếu: ',
  DELETE_CONFIRM: (num: string) =>
    `Xoá phiếu chi "${num}"? Số dư tài khoản sẽ được cập nhật lại.`,
  EMPTY_TITLE_FILTER: 'Không tìm thấy phiếu chi',
  EMPTY_TITLE: 'Chưa có phiếu chi nào',
  EMPTY_DESC_FILTER: 'Thử điều chỉnh bộ lọc.',
  EMPTY_DESC: 'Nhấn "Tạo phiếu chi" để bắt đầu ghi nhận chi phí.',
  EMPTY_ACTION: '+ Tạo phiếu chi',
  PAGINATION_LABEL: 'phiếu chi',
  COL_EXPENSE_NO: 'Số phiếu / Ngày',
  COL_AMOUNT: 'Số tiền',
  COL_CATEGORY: 'Danh mục',
  COL_DESC: 'Mô tả',
  COL_ACCOUNT: 'Tài khoản',
  COL_ACTIONS: 'Thao tác',
  BTN_EDIT_TITLE: 'Sửa',
  BTN_DELETE_TITLE: 'Xóa',
  LBL_SUPPLIER_PREFIX: 'NCC: ',
  LBL_FUND_PREFIX: 'Quỹ: ',
} as const;

export const PAYMENT_LIST_MESSAGES = {
  TITLE: 'Phiếu thu',
  SUBTITLE: 'Quản lý các khoản thu tiền',
  FILTER_SEARCH_LABEL: 'Tìm kiếm',
  FILTER_SEARCH_PLACEHOLDER: 'Số phiếu thu, khách hàng...',
  FILTER_DATE: 'Thời gian thu',
  ERROR_LOAD: 'Lỗi tải dữ liệu: ',
  ERROR_DELETE: 'Lỗi xóa phiếu: ',
  DELETE_CONFIRM: 'Xoà phiếu thu này? Số tiền sẽ bị trừ khỏi đơn hàng.',
  EMPTY_TITLE_FILTER: 'Không tìm thấy phiếu thu',
  EMPTY_TITLE: 'Chưa có phiếu thu nào',
  EMPTY_DESC_FILTER: 'Thử điều chỉnh bộ lọc.',
  EMPTY_DESC: 'Phiếu thu được tạo tự động khi xác nhận thanh toán đơn hàng.',
  PAGINATION_LABEL: 'phiếu thu',
  COL_PAYMENT_NO: 'Số phiếu',
  COL_ORDER: 'Đơn hàng',
  COL_CUSTOMER: 'Khách hàng',
  COL_DATE: 'Ngày thu',
  COL_AMOUNT: 'Số tiền',
  COL_METHOD: 'Hình thức',
  BTN_DELETE_TITLE: 'Xóa phiếu thu',
  LBL_DATE_PREFIX: 'Ngày: ',
  BTN_DELETE: 'Xóa phiếu',
} as const;

export const PAYMENTS_PAGE_TABS = {
  CASH_FLOW: 'Dòng tiền',
  RECEIPTS: 'Phiếu thu',
  EXPENSES: 'Phiếu chi',
  CUSTOMER_DEBTS: 'Công nợ KH',
  SUPPLIER_DEBTS: 'Công nợ NCC',
  ACCOUNTS: 'Tài khoản',
};

export const PAYMENTS_PAGE_MESSAGES = {
  TITLE: 'Quản lý Tiền tệ',
};

export const PAYMENT_FORM_MESSAGES = {
  SUCCESS_FULLY_PAID: '✅ Đơn hàng đã được thanh toán đầy đủ.',
};

export const EXPENSE_FORM_MESSAGES = {
  ACCOUNT_LABEL: (name: string, balance: string) => `${name} (${balance} đ)`,
};

export const DEBTS_PAGE_TABS = {
  CUSTOMER: 'Công nợ Khách hàng',
  SUPPLIER: 'Công nợ Nhà cung cấp',
};

export const DEBTS_PAGE_MESSAGES = {
  TITLE: 'Quản lý Công nợ',
};

export const CASH_FLOW_MESSAGES = {
  COL_DATE: 'Ngày',
  COL_INFLOW: 'Thu vào',
  COL_OUTFLOW: 'Chi ra',
  COL_NET: 'Chênh lệch',
  COL_RECEIPTS: 'Số phiếu thu',
  COL_EXPENSES: 'Số phiếu chi',
  COL_CATEGORY: 'Danh mục',
  COL_VOUCHERS: 'Số phiếu',
  COL_TOTAL: 'Tổng tiền',
  COL_RATIO: 'Tỉ trọng',

  TITLE: 'Dòng tiền',
  LBL_FROM_DATE: 'Từ ngày',
  LBL_TO_DATE: 'Đến ngày',

  SUM_INFLOW: 'Tổng thu',
  SUM_OUTFLOW: 'Tổng chi',
  SUM_NET: 'Chênh lệch',
  SUM_BALANCE: 'Số dư tài khoản',
  TREND_POSITIVE: 'Dương',
  TREND_NEGATIVE: 'Âm',

  SEC_EXPENSE_BY_CAT: 'Chi phí theo danh mục',
  EMPTY_EXPENSE_TITLE: 'Không có chi phí',
  EMPTY_EXPENSE_DESC: 'Chưa có phiếu chi nào trong khoảng thời gian này.',
  LBL_VOUCHER_COUNT: (count: number) => `${count} phiếu`,

  SEC_DAILY_DETAIL: 'Chi tiết theo ngày',
  EMPTY_DAILY_TITLE: 'Không có giao dịch',
  EMPTY_DAILY_DESC: 'Chưa có giao dịch nào trong khoảng thời gian này.',
};

export const UNPAID_DOCS_MESSAGES = {
  DEDUCT_DEBT: 'Đối trừ công nợ (Tự động tính vào số tiền chi)',
  LBL_DATE: 'Ngày:',
  LBL_PAID: 'Đã thanh toán:',
  DOC_WEAVING: 'Phiếu dệt',
  DOC_YARN: 'Phiếu nhập sợi',
  DOC_FABRIC: (count: number) => `Mua vải thành phẩm (${count} cuộn)`,
  DOC_FABRIC_SUB: 'Phiếu mua vải',
};

export const DEBT_SUMMARY_MESSAGES = {
  COL_CUSTOMER: 'Khách hàng',
  COL_SUPPLIER: 'Nhà cung cấp',
  COL_DOCS: 'Số đơn',
  COL_VOUCHERS: 'Số phiếu',
  COL_DEBT: 'Còn nợ',
  BTN_PAY: 'Thanh toán',
  ERR_PREFIX: 'Lỗi: ',
};

export const PAYMENTS_MODULE_MESSAGES = {
  TITLE: 'Tài chính & Thanh toán',
  DESC: 'Quản lý thu chi, công nợ nhà cung cấp, nhật ký thanh toán và tài khoản ngân hàng.',
  LBL_FUND: 'Số dư quỹ',
  VAL_FUND: '1.5 tỷ',
  LBL_EXPENSE: 'Chi tháng này',
  VAL_EXPENSE: '450 triệu',
  FEAT_1: 'Quản lý đa tài khoản.',
  FEAT_2: 'Theo dõi chi phí sản xuất.',
  FEAT_3: 'Đối soát công nợ tự động.',
  ROADMAP_1: 'Tích hợp cổng thanh toán API.',
  ROADMAP_2: 'Báo cáo lưu chuyển tiền tệ chi tiết.',
};
