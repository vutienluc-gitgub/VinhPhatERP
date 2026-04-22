import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

import { formatCurrency } from '@/shared/utils/format';
import { sumBy } from '@/shared/utils/array.util';

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
    <div className="bg-surface border border-border rounded-[10px] py-2.5 px-3.5 shadow-[0_4px_20px_rgba(16,35,61,0.12)] min-w-[170px]">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-2.5 h-2.5 rounded-[2px] shrink-0"
          style={{ background: entry?.payload?.color ?? '#3b82f6' }}
        />
        <span className="text-[12px] font-bold text-[var(--text)]">
          {entry?.name}
        </span>
      </div>
      <p className="text-[13px] font-bold text-[var(--text)] pl-[18px]">
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
      <div className="h-[220px] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-[var(--muted)] text-[13px]">
        Chưa có dữ liệu thu tiền
      </div>
    );
  }

  const total = sumBy(data, (d) => d.value);

  const slices = data.map((d, i) => ({
    ...d,
    color: PALETTE[i % PALETTE.length]!,
    pct: total > 0 ? Math.round((d.value / total) * 100) : 0,
  }));

  return (
    <div className="flex flex-col gap-4">
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
      <div className="flex flex-col gap-2 px-2 pb-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2.5">
            {/* Color dot */}
            <div
              className="w-2.5 h-2.5 rounded-[3px] shrink-0"
              style={{ background: s.color }}
            />
            {/* Label */}
            <span className="flex-1 text-[12px] font-semibold text-[var(--muted)] truncate">
              {s.label}
            </span>
            {/* Percentage badge */}
            <span
              className="text-[11px] font-bold rounded-md px-[7px] py-[1px] shrink-0"
              style={{
                color: s.color,
                backgroundColor: `${s.color}18`,
              }}
            >
              {s.pct}%
            </span>
            {/* Value */}
            <span className="text-[12px] font-bold text-[var(--text)] shrink-0 min-w-[72px] text-right tabular-nums">
              {formatCurrency(s.value)} đ
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
