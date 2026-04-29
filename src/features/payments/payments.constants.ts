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
