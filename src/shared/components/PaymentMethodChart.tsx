import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

import { formatCurrency } from '@/shared/utils/format';

type PaymentSlice = {
  label: string;
  value: number;
};

type PaymentMethodChartProps = {
  data: PaymentSlice[];
  isLoading?: boolean;
};

const PALETTE = [
  '#3b82f6',
  '#10b981',
  '#f97316',
  '#a855f7',
  '#eab308',
  '#06b6d4',
  '#ec4899',
  '#ef4444',
];

type CustomTooltipProps = {
  active?: boolean;
  payload?: { name?: string; value?: number; payload?: { color?: string } }[];
};

function CustomTooltip({ active, payload }: CustomTooltipProps) {
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
        minWidth: '170px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px',
        }}
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '2px',
            background: entry?.payload?.color ?? '#3b82f6',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--text)',
          }}
        >
          {entry?.name}
        </span>
      </div>
      <p
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--text)',
          paddingLeft: '18px',
        }}
      >
        {formatCurrency(entry?.value ?? 0)} đ
      </p>
    </div>
  );
}

/**
 * Premium Donut Chart for payment method breakdown.
 * Shows each method's share with a legend below.
 */
export function PaymentMethodChart({
  data,
  isLoading = false,
}: PaymentMethodChartProps) {
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
        Chưa có dữ liệu thu tiền
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  const slices = data.map((d, i) => ({
    ...d,
    color: PALETTE[i % PALETTE.length]!,
    pct: total > 0 ? Math.round((d.value / total) * 100) : 0,
  }));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Donut chart */}
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            strokeWidth={0}
          >
            {slices.map((s, i) => (
              <Cell key={i} fill={s.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '0 8px 4px',
        }}
      >
        {slices.map((s, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {/* Color dot */}
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '3px',
                background: s.color,
                flexShrink: 0,
              }}
            />
            {/* Label */}
            <span
              style={{
                flex: 1,
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {s.label}
            </span>
            {/* Percentage badge */}
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: s.color,
                background: `${s.color}18`,
                borderRadius: '6px',
                padding: '1px 7px',
                flexShrink: 0,
              }}
            >
              {s.pct}%
            </span>
            {/* Value */}
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text)',
                flexShrink: 0,
                minWidth: '72px',
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatCurrency(s.value)} đ
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
