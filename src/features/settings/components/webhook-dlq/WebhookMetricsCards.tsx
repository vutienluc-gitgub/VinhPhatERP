import { Icon } from '@/shared/components';
import type { WebhookMetricsSummary } from '@/api/webhook-dlq.api';

interface WebhookMetricsCardsProps {
  metrics: WebhookMetricsSummary | undefined;
  isLoading: boolean;
}

export function WebhookMetricsCards({
  metrics,
  isLoading,
}: WebhookMetricsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-surface-secondary animate-pulse border border-default"
          />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Tổng sự kiện nhận',
      value: metrics?.total_events ?? 0,
      icon: 'Activity' as const,
      desc: `Trong ${metrics?.time_window_hours ?? 24}h qua`,
      colorClass: 'text-info',
      bgClass: 'bg-info-soft',
    },
    {
      title: 'Tỷ lệ thành công',
      value: `${metrics?.success_rate_percentage ?? 100}%`,
      icon: 'CheckCircle2' as const,
      desc: `${metrics?.processed_events ?? 0} sự kiện xử lý hoàn tất`,
      colorClass: 'text-success',
      bgClass: 'bg-success-soft',
    },
    {
      title: 'Đang tự động thử lại',
      value: metrics?.retry_events ?? 0,
      icon: 'RefreshCw' as const,
      desc: 'Sự kiện gặp lỗi tạm thời (Backoff)',
      colorClass: 'text-warning',
      bgClass: 'bg-warning-soft',
    },
    {
      title: 'Dead Letter Queue (DLQ)',
      value: metrics?.dead_letter_events ?? 0,
      icon: 'AlertTriangle' as const,
      desc: 'Vượt quá số lần thử lại tối đa',
      colorClass: 'text-danger',
      bgClass: 'bg-danger-soft',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-xl border border-default bg-surface p-4 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              {card.title}
            </span>
            <div
              className={`w-8 h-8 rounded-lg ${card.bgClass} ${card.colorClass} flex items-center justify-center`}
            >
              <Icon name={card.icon} size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">
              {card.value}
            </div>
            <p className="text-xs text-muted mt-0.5">{card.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
