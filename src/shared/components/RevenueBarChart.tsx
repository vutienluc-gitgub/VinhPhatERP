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
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 4px 20px rgba(16,35,61,0.12)',
        fontSize: '12px',
        minWidth: '160px',
      }}
    >
      <p
        style={{
          color: 'var(--muted)',
          fontWeight: 700,
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '8px',
        }}
      >
        {label}
      </p>
      {payload.map((entry, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '4px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '2px',
                background: entry.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                color: 'var(--muted)',
                fontSize: '11px',
              }}
            >
              {String(entry.name)}
            </span>
          </div>
          <span
            style={{
              fontWeight: 700,
              color: 'var(--text)',
              fontSize: '12px',
            }}
          >
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
      <div
        style={{
          height: '220px',
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
          height: '220px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)',
          fontSize: '13px',
        }}
      >
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
