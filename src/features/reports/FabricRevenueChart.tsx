import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import type { RevenueByFabricRow } from '@/api/reports.api';

type FabricRevenueChartProps = {
  data: RevenueByFabricRow[];
  isLoading?: boolean;
};

const PALETTE = [
  '#3b82f6',
  '#f97316',
  '#a855f7',
  '#22c55e',
  '#ec4899',
  '#eab308',
  '#06b6d4',
  '#ef4444',
  '#8b5cf6',
  '#14b8a6',
];

function formatShort(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}T`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}Tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

type TooltipEntry = {
  value?: number;
  color?: string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
};

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];

  return (
    <div className="bg-surface border border-border rounded-[10px] py-2.5 px-3.5 shadow-[0_4px_20px_rgba(16,35,61,0.12)] min-w-[180px]">
      <p className="text-[var(--muted)] font-bold text-[10px] uppercase tracking-wider mb-1.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-[2px] shrink-0"
          style={{ background: entry?.color ?? '#3b82f6' }}
        />
        <span className="text-[var(--text)] font-bold text-[13px]">
          {formatShort(entry?.value ?? 0)} đ
        </span>
      </div>
    </div>
  );
}

/**
 * Premium Fabric Revenue Horizontal Bar Chart using Recharts.
 * Layout: vertical — bars run left to right, ranked top to bottom.
 */
export function FabricRevenueChart({
  data,
  isLoading = false,
}: FabricRevenueChartProps) {
  if (isLoading) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-[var(--muted)] text-[13px]">
        Chưa có dữ liệu cơ cấu vải
      </div>
    );
  }

  const chartData = data.slice(0, 10).map((r) => ({
    name: `${r.fabric_type}${r.color_name ? ` (${r.color_name})` : ''}`,
    value: r.total_revenue,
  }));

  const chartHeight = Math.max(chartData.length * 36 + 16, 200);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{
          top: 4,
          right: 56,
          left: 8,
          bottom: 4,
        }}
        barCategoryGap="25%"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(16,35,61,0.06)"
          horizontal={false}
        />
        <XAxis
          type="number"
          axisLine={false}
          tickLine={false}
          tick={{
            fontSize: 10,
            fill: '#5c6f88',
          }}
          tickFormatter={formatShort}
        />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{
            fontSize: 11,
            fill: '#5c6f88',
            fontWeight: 600,
          }}
          width={110}
          tickFormatter={(v: string) =>
            v.length > 14 ? `${v.slice(0, 14)}…` : v
          }
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: 'rgba(11,107,203,0.04)' }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
          {chartData.map((_, idx) => (
            <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
