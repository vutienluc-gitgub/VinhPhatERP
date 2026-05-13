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
  success: { label: 'Hoàn thành', cssClass: 'is-success' },
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
