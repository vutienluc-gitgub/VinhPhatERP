import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import type { MonthlyRevenueRow } from '@/api/reports.api';

type RevenueBarChartProps = {
  data: MonthlyRevenueRow[];
  isLoading?: boolean;
};

type TooltipEntry = {
  dataKey?: string;
  name?: string;
  value?: number;
  color?: string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
};

function formatShort(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}T`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}Tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function formatMonth(month: string): string {
  const parts = month.split('-');
  if (parts.length < 2) return month;
  return `T${parts[1]}/${parts[0]?.slice(2)}`;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-[10px] py-2.5 px-3.5 shadow-[0_4px_20px_rgba(16,35,61,0.12)] text-xs min-w-[160px]">
      <p className="text-[var(--muted)] font-bold text-[10px] uppercase tracking-wider mb-2">
        {label}
      </p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-[2px] shrink-0"
              style={{ background: entry.color }}
            />
            <span className="text-[var(--muted)] text-[11px]">
              {String(entry.name)}
            </span>
          </div>
          <span className="font-bold text-[var(--text)] text-[12px]">
            {formatShort(Number(entry.value ?? 0))} đ
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Premium Revenue Bar Chart using Recharts.
 * Shows monthly revenue vs collected side by side.
 */
export function RevenueBarChart({
  data,
  isLoading = false,
}: RevenueBarChartProps) {
  if (isLoading) {
    return (
      <div className="h-[220px] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-[var(--muted)] text-[13px]">
        Chưa có dữ liệu doanh thu theo tháng
      </div>
    );
  }

  const chartData = [...data].reverse().map((r) => ({
    month: formatMonth(r.month),
    'Doanh thu': r.total_revenue,
    'Đã thu': r.total_collected,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={chartData}
        barCategoryGap="30%"
        barGap={4}
        margin={{
          top: 8,
          right: 8,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(16,35,61,0.06)"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{
            fontSize: 11,
            fill: '#5c6f88',
            fontWeight: 600,
          }}
          dy={6}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{
            fontSize: 10,
            fill: '#5c6f88',
          }}
          tickFormatter={formatShort}
          width={40}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{
            fill: 'rgba(11,107,203,0.04)',
            radius: 6,
          }}
        />
        <Bar
          dataKey="Doanh thu"
          fill="#3b82f6"
          radius={[6, 6, 0, 0]}
          maxBarSize={40}
        />
        <Bar
          dataKey="Đã thu"
          fill="#10b981"
          radius={[6, 6, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
