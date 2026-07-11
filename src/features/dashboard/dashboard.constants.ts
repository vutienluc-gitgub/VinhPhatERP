/* ── Dashboard shared constants ── */

/** Accent color used for expense/spending highlights */
export const EXPENSE_ACCENT = '#FF6B35';

/** Standard period labels for dashboard cards */
export const DASHBOARD_LABELS = {
  THIS_MONTH: 'Tháng này',
  THIS_YEAR: 'Năm nay',
  VIEW_ALL: 'Xem tất cả',
  NO_DEBTS: 'Không có công nợ nào sắp đến hạn',
  NO_TRANSACTIONS: 'Chưa có giao dịch nào gần đây',
  REVENUE_TITLE: 'Doanh thu bán hàng',
  SPENDING_TITLE: 'Chi phí nhập sợi',
  CASHFLOW_TITLE: 'Dòng tiền',
  DEBTS_TITLE: 'Công nợ sắp đến hạn',
  TRANSACTIONS_TITLE: 'Giao dịch gần đây',
  INCOME_LABEL: 'Thu',
  EXPENSE_LABEL: 'Chi',
  FILTER_LABEL: 'Lọc',
  PAYABLE: 'Phải trả',
  RECEIVABLE: 'Phải thu',
  TX_ACTIVITY: 'Hoạt động',
  TX_DATE: 'Ngày',
  TX_AMOUNT: 'Số tiền',
  TX_STATUS: 'Trạng thái',
} as const;

/** Status labels for recent transactions */
export const TX_STATUS_MAP: Record<
  string,
  { label: string; cssClass: string }
> = {
  success: {
    label: 'Hoàn thành',
    cssClass: 'text-emerald-500 bg-emerald-500/10',
  },
  pending: { label: 'Đang xử lý', cssClass: 'is-pending' },
  failed: { label: 'Thất bại', cssClass: 'is-failed' },
};

/** Breakdown color palette for spending chart */
export const BREAKDOWN_COLORS = [
  EXPENSE_ACCENT,
  '#F7C948',
  '#94A3B8',
  '#3B82F6',
  '#10B981',
];

/** Debt type icon config */
export const DEFAULT_DEBT_STYLE = {
  icon: 'Package',
  color: EXPENSE_ACCENT,
  bg: 'rgba(255, 107, 53, 0.1)',
} as const;

export const DEBT_TYPE_ICONS: Record<
  string,
  { icon: string; color: string; bg: string }
> = {
  supplier: { ...DEFAULT_DEBT_STYLE },
  customer: {
    icon: 'Users',
    color: 'var(--primary)',
    bg: 'rgba(var(--brand-rgb), 0.1)',
  },
};

/* ── Notification Banner Labels ── */

export const NOTIFICATION_LABELS = {
  OVERDUE_ORDERS: 'Đơn hàng trễ hạn',
  PENDING_SHIPMENTS: 'Phiếu xuất chờ xử lý',
  DRAFT_ORDERS: 'Đơn nháp chưa xác nhận',
  EXPIRING_QUOTATIONS: 'Báo giá sắp hết hạn',
  ALL_CLEAR: 'Tất cả công việc đã được xử lý',
  QUICK_ACCESS_TITLE: 'Nghiệp vụ thường dùng',
} as const;

/** Labels used by PendingTasksCard (shared with notification banner) */
export const PENDING_TASKS_LABELS = {
  OVERDUE: NOTIFICATION_LABELS.OVERDUE_ORDERS,
  EXPIRING_QUOTATIONS: NOTIFICATION_LABELS.EXPIRING_QUOTATIONS,
  PENDING_SHIPMENTS: NOTIFICATION_LABELS.PENDING_SHIPMENTS,
  DRAFT_ORDERS: NOTIFICATION_LABELS.DRAFT_ORDERS,
  DEBT_PREFIX: 'Công nợ còn',
  DEBT_SUFFIX: 'đ',
} as const;

/* ── Quick Access Toolbar Items ── */

type QuickAccessItem = {
  id: string;
  icon: string;
  label: string;
  href: string;
  iconColor: string;
  bgColor: string;
};

export const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    id: 'new-order',
    icon: 'PackagePlus',
    label: 'Tạo đơn hàng',
    href: '/orders/new',
    iconColor: '#2151A1',
    bgColor: 'rgba(33, 81, 161, 0.1)',
  },
  {
    id: 'yarn-receipt',
    icon: 'ClipboardCheck',
    label: 'Nhập sợi',
    href: '/yarn-receipts/new',
    iconColor: '#0a805c',
    bgColor: 'rgba(10, 128, 92, 0.1)',
  },
  {
    id: 'expense',
    icon: 'Receipt',
    label: 'Chi tiền',
    href: '/payments?tab=expenses&action=new',
    iconColor: '#c0392b',
    bgColor: 'rgba(192, 57, 43, 0.1)',
  },
  {
    id: 'shipment',
    icon: 'Truck',
    label: 'Xuất hàng',
    href: '/shipments',
    iconColor: '#d97706',
    bgColor: 'rgba(217, 119, 6, 0.1)',
  },
  {
    id: 'dyeing',
    icon: 'Palette',
    label: 'Phiếu nhuộm',
    href: '/dyeing-orders',
    iconColor: '#7c3aed',
    bgColor: 'rgba(124, 58, 237, 0.1)',
  },
  {
    id: 'quotation',
    icon: 'FileText',
    label: 'Báo giá',
    href: '/quotations',
    iconColor: '#0891b2',
    bgColor: 'rgba(8, 145, 178, 0.1)',
  },
  {
    id: 'purchase-order',
    icon: 'ShoppingCart',
    label: 'Đặt hàng NCC',
    href: '/purchase-orders/create',
    iconColor: '#be185d',
    bgColor: 'rgba(190, 24, 93, 0.1)',
  },
];
