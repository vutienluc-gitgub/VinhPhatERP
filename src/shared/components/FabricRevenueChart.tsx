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
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 4px 20px rgba(16,35,61,0.12)',
        minWidth: '180px',
      }}
    >
      <p
        style={{
          color: 'var(--muted)',
          fontWeight: 700,
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '6px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '200px',
        }}
      >
        {label}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '2px',
            background: entry?.color ?? '#3b82f6',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            color: 'var(--text)',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
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
      <div
        style={{
          height: '280px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        style={{
          height: '280px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)',
          fontSize: '13px',
        }}
      >
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
