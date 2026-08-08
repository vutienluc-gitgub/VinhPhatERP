import { useMemo } from 'react';

import { formatCompactCurrency } from '@/shared/utils/format';
import type { MonthlyDataPoint } from '@/application/analytics';

import { DashCardHeader } from './DashCardHeader';
import { DASHBOARD_LABELS, EXPENSE_ACCENT } from './dashboard.constants';

type CashFlowCardProps = {
  revenueData: MonthlyDataPoint[];
  revenueTotal: number;
  isLoading: boolean;
};

const BAR_COLORS = {
  income: 'var(--primary)',
  expense: EXPENSE_ACCENT,
};

function CashFlowBarChart({ data }: { data: MonthlyDataPoint[] }) {
  const maxVal = useMemo(
    () => Math.max(...data.map((d) => d.value), 1),
    [data],
  );

  const currentMonth = useMemo(() => new Date().getMonth(), []);

  return (
    <div className="dash-cashflow-chart">
      <div className="dash-cashflow-y-axis">
        {[maxVal, maxVal * 0.66, maxVal * 0.33, 0].map((v, idx) => (
          <span key={idx} className="dash-cashflow-y-label">
            {formatCompactCurrency(v)}
          </span>
        ))}
      </div>
      <div className="dash-cashflow-bars">
        {data.map((d, i) => {
          const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
          const isActive = i === currentMonth;
          return (
            <div key={d.month} className="dash-cashflow-bar-group">
              <div
                className={`dash-cashflow-bar ${isActive ? 'text-foreground bg-primary/10' : ''}`}
                style={{
                  height: `${Math.max(pct, 2)}%`,
                  background: isActive ? BAR_COLORS.expense : BAR_COLORS.income,
                  opacity: isActive ? 1 : 0.6,
                }}
              />
              <span className="dash-cashflow-x-label">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CashFlowCard({
  revenueData,
  revenueTotal,
  isLoading,
}: CashFlowCardProps) {
  const currentMonth = useMemo(() => new Date().getMonth(), []);
  const currentVal = revenueData[currentMonth]?.value ?? 0;

  if (isLoading) {
    return (
      <div className="dash-cashflow-card">
        <div className="dash-card-header">
          <div className="skeleton-block h-3 w-24" />
          <div className="skeleton-block h-3 w-16" />
        </div>
        <div className="skeleton-block h-8 w-36 mt-3" />
        <div className="skeleton-block h-[160px] mt-4" />
      </div>
    );
  }

  return (
    <div className="dash-cashflow-card">
      <DashCardHeader
        title={DASHBOARD_LABELS.CASHFLOW_TITLE}
        period={DASHBOARD_LABELS.THIS_YEAR}
      />

      <span className="dash-card-big-value">
        {formatCompactCurrency(revenueTotal)}
      </span>

      <div className="dash-cashflow-legend-row">
        <div className="dash-cashflow-legend">
          <span
            className="dash-breakdown-dot"
            style={{ background: BAR_COLORS.income }}
          />
          <span>{DASHBOARD_LABELS.INCOME_LABEL}</span>
        </div>
        <div className="dash-cashflow-legend">
          <span
            className="dash-breakdown-dot"
            style={{ background: BAR_COLORS.expense }}
          />
          <span>{DASHBOARD_LABELS.EXPENSE_LABEL}</span>
        </div>

        {currentVal > 0 && (
          <div className="dash-tooltip-preview ml-auto">
            <span className="dash-tooltip-label">
              Tháng {currentMonth + 1} :
            </span>
            <span className="dash-tooltip-value">
              {formatCompactCurrency(currentVal)}
            </span>
          </div>
        )}
      </div>

      <div className="dash-chart-area dash-chart-area--tall">
        <CashFlowBarChart data={revenueData} />
      </div>
    </div>
  );
}
