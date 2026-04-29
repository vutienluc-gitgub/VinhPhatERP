/**
 * FulfillmentKpiCards — 4 KPI cards tổng hợp.
 */
import { Icon } from '@/shared/components';
import type { FulfillmentSummary } from '@/api/order-fulfillment.api';

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
      label: 'Tổng ĐH đang xử lý',
      value: summary.totalOrders,
      subtitle: `${summary.fulfilledOrders} đã giao đủ`,
      icon: 'Package',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-100',
    },
    {
      label: 'Đã hoàn thành SX',
      value: summary.fulfilledOrders,
      subtitle: `/${summary.totalOrders} đơn hàng`,
      icon: 'CircleCheck',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-100',
    },
    {
      label: 'Trễ hạn giao',
      value: summary.overdueOrders,
      subtitle: summary.overdueOrders > 0 ? 'Cần xử lý gấp' : 'Tốt',
      icon: 'Clock',
      color: summary.overdueOrders > 0 ? 'text-red-600' : 'text-zinc-500',
      bgColor:
        summary.overdueOrders > 0
          ? 'bg-red-50 border-red-100'
          : 'bg-zinc-50 border-zinc-100',
    },
    {
      label: 'Tỉ lệ hoàn thành TB',
      value: `${summary.avgFulfillmentPct}%`,
      subtitle: `${summary.totalProducedM.toLocaleString()}m / ${summary.totalTargetM.toLocaleString()}m`,
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
