import { useMemo } from 'react';

import { Icon } from '@/shared/components';
import { formatCompactCurrency } from '@/shared/utils/format';
import type { MonthlyDataPoint } from '@/application/analytics';

import { DashCardHeader } from './DashCardHeader';
import { DASHBOARD_LABELS } from './dashboard.constants';

type RevenueOverviewCardProps = {
  data: MonthlyDataPoint[];
  total: number;
  changePercent: number | null;
  isLoading: boolean;
};

const CHART_HEIGHT = 120;
const CHART_PADDING_TOP = 20;

function MiniLineChart({ data }: { data: MonthlyDataPoint[] }) {
  const maxVal = useMemo(
    () => Math.max(...data.map((d) => d.value), 1),
    [data],
  );

  const currentMonth = useMemo(() => new Date().getMonth(), []);

  const points = useMemo(() => {
    const step = 100 / Math.max(data.length - 1, 1);
    return data.map((d, i) => {
      const x = step * i;
      const y =
        CHART_HEIGHT -
        CHART_PADDING_TOP -
        (d.value / maxVal) * (CHART_HEIGHT - CHART_PADDING_TOP * 2) +
        CHART_PADDING_TOP;
      return { x, y, ...d };
    });
  }, [data, maxVal]);

  if (data.length === 0) return null;

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1]?.x ?? 100} ${CHART_HEIGHT} L ${points[0]?.x ?? 0} ${CHART_HEIGHT} Z`;

  return (
    <svg
      viewBox={`0 0 100 ${CHART_HEIGHT}`}
      preserveAspectRatio="none"
      className="dash-chart-svg"
    >
      <defs>
        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#revenueGrad)" />
      <path
        d={pathD}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {points.map((p, i) =>
        i === currentMonth ? (
          <circle
            key={p.month}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="var(--surface-strong)"
            stroke="var(--primary)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ) : null,
      )}
    </svg>
  );
}

export function RevenueOverviewCard({
  data,
  total,
  changePercent,
  isLoading,
}: RevenueOverviewCardProps) {
  const currentMonth = useMemo(() => new Date().getMonth(), []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentMonthData = data[currentMonth];

  if (isLoading) {
    return (
      <div className="dash-overview-card">
        <div className="dash-card-header">
          <div className="skeleton-block h-3 w-28" />
          <div className="skeleton-block h-3 w-20" />
        </div>
        <div className="skeleton-block h-8 w-36 mt-3" />
        <div className="skeleton-block h-[80px] mt-4" />
      </div>
    );
  }

  const isUp = changePercent !== null && changePercent >= 0;

  return (
    <div className="dash-overview-card">
      <DashCardHeader
        title={DASHBOARD_LABELS.REVENUE_TITLE}
        period={DASHBOARD_LABELS.THIS_MONTH}
      />

      <div className="dash-card-value-row">
        <span className="dash-card-big-value">
          {formatCompactCurrency(total)}
        </span>
        {changePercent !== null && (
          <span className={`dash-change-badge ${isUp ? 'is-up' : 'is-down'}`}>
            <Icon name={isUp ? 'TrendingUp' : 'TrendingDown'} size={12} />
            {Math.abs(changePercent)}%
          </span>
        )}
      </div>

      {currentMonthData && currentMonthData.value > 0 && (
        <div className="dash-tooltip-preview">
          <span className="dash-tooltip-label">
            Tháng {currentMonth + 1}/{currentYear} :
          </span>
          <span className="dash-tooltip-value">
            {formatCompactCurrency(currentMonthData.value)}
          </span>
        </div>
      )}

      <div className="dash-chart-area">
        <MiniLineChart data={data} />
        <div className="dash-chart-labels">
          {data.slice(0, 6).map((d) => (
            <span key={d.month} className="dash-chart-label">
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
