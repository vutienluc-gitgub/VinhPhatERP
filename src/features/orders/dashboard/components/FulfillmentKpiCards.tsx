/**
 * FulfillmentKpiCards — 4 KPI cards tổng hợp.
 */
import { Icon } from '@/shared/components';
import { formatQuantity } from '@/shared/utils/format';
import type { FulfillmentSummary } from '@/api/order-fulfillment.api';
import { ORDERS_DASHBOARD_LABELS } from '@/features/orders/orders.constants';

interface FulfillmentKpiCardsProps {
  summary: FulfillmentSummary;
  isLoading: boolean;
}

interface KpiCardData {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: string;
  bgColor: string;
}

export function FulfillmentKpiCards({
  summary,
  isLoading,
}: FulfillmentKpiCardsProps) {
  const cards: KpiCardData[] = [
    {
      label: ORDERS_DASHBOARD_LABELS.DASH_KPI_TOTAL_PROC,
      value: summary.totalOrders,
      subtitle: `${summary.fulfilledOrders} ${ORDERS_DASHBOARD_LABELS.DASH_KPI_FULFILLED}`,
      icon: 'Package',
      color: 'text-info',
      bgColor: 'bg-blue-50 border-info',
    },
    {
      label: ORDERS_DASHBOARD_LABELS.DASH_KPI_PROD_DONE,
      value: summary.fulfilledOrders,
      subtitle: `/${summary.totalOrders} ${ORDERS_DASHBOARD_LABELS.DASH_KPI_ORDERS}`,
      icon: 'CircleCheck',
      color: 'text-success',
      bgColor: 'bg-emerald-50 border-success',
    },
    {
      label: ORDERS_DASHBOARD_LABELS.DASH_KPI_LATE_DELIV,
      value: summary.overdueOrders,
      subtitle:
        summary.overdueOrders > 0
          ? ORDERS_DASHBOARD_LABELS.DASH_KPI_URGENT
          : ORDERS_DASHBOARD_LABELS.DASH_KPI_GOOD,
      icon: 'Clock',
      color: summary.overdueOrders > 0 ? 'text-danger' : 'text-zinc-500',
      bgColor:
        summary.overdueOrders > 0
          ? 'bg-red-50 border-danger'
          : 'bg-zinc-50 border-zinc-100',
    },
    {
      label: ORDERS_DASHBOARD_LABELS.DASH_KPI_AVG_PCT,
      value: `${summary.avgFulfillmentPct}%`,
      subtitle: `${formatQuantity(summary.totalProducedM)}m / ${formatQuantity(summary.totalTargetM)}m`,
      icon: 'TrendingUp',
      color: 'text-violet-600',
      bgColor: 'bg-violet-50 border-violet-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border p-4 ${card.bgColor} ${isLoading ? 'animate-pulse' : ''}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${card.color} bg-white/70`}
            >
              <Icon name={card.icon} size={16} />
            </div>
          </div>
          <div className={`text-2xl font-bold ${card.color} tabular-nums`}>
            {isLoading ? '—' : card.value}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">{card.label}</div>
          {card.subtitle && (
            <div className="text-[10px] text-zinc-400 mt-1">
              {card.subtitle}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
