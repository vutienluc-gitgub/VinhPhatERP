import { Icon } from '@/shared/components';
import {
  formatCompactCurrency,
  formatCurrency,
} from '@/shared/value/core/formatter';
import type { SpendingBreakdown } from '@/application/analytics';

import { DashCardHeader } from './DashCardHeader';
import { DASHBOARD_LABELS } from './dashboard.constants';

type SpendingOverviewCardProps = {
  total: number;
  changePercent: number | null;
  breakdown: SpendingBreakdown[];
  isLoading: boolean;
};

function BreakdownBar({
  breakdown,
  total,
}: {
  breakdown: SpendingBreakdown[];
  total: number;
}) {
  if (total === 0) return null;

  return (
    <div className="dash-breakdown-area">
      <div className="dash-breakdown-legends">
        {breakdown.map((item) => (
          <div key={item.label} className="dash-breakdown-legend-item">
            <span
              className="dash-breakdown-dot"
              style={{ background: item.color }}
            />
            <span className="dash-breakdown-label">{item.label}</span>
            <span className="dash-breakdown-amount">
              {formatCompactCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="dash-breakdown-bar">
        {breakdown.map((item) => {
          const pct = Math.max((item.value / total) * 100, 2);
          return (
            <div
              key={item.label}
              className="dash-breakdown-segment"
              style={{ width: `${pct}%`, background: item.color }}
              // eslint-disable-next-line no-restricted-syntax
              title={`${item.label}: ${formatCurrency(item.value)}đ`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function SpendingOverviewCard({
  total,
  changePercent,
  breakdown,
  isLoading,
}: SpendingOverviewCardProps) {
  if (isLoading) {
    return (
      <div className="dash-overview-card">
        <div className="dash-card-header">
          <div className="skeleton-block h-3 w-28" />
          <div className="skeleton-block h-3 w-20" />
        </div>
        <div className="skeleton-block h-8 w-36 mt-3" />
        <div className="skeleton-block h-6 mt-4" />
        <div className="skeleton-block h-3 mt-3" />
      </div>
    );
  }

  const isUp = changePercent !== null && changePercent >= 0;

  return (
    <div className="dash-overview-card">
      <DashCardHeader
        title={DASHBOARD_LABELS.SPENDING_TITLE}
        period={DASHBOARD_LABELS.THIS_MONTH}
      />

      <div className="dash-card-value-row">
        <span className="dash-card-big-value">
          {formatCompactCurrency(total)}
        </span>
        {changePercent !== null && (
          <span className={`dash-change-badge ${isUp ? 'is-down' : 'is-up'}`}>
            <Icon name={isUp ? 'TrendingUp' : 'TrendingDown'} size={12} />
            {Math.abs(changePercent)}%
          </span>
        )}
      </div>

      <BreakdownBar breakdown={breakdown} total={total} />
    </div>
  );
}
