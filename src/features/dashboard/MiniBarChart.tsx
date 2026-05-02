/**
 * Default color palette — cycles automatically when no color is provided.
 */
const PALETTE = [
  '#3B82F6',
  '#F97316',
  '#A855F7',
  '#22C55E',
  '#EC4899',
  '#EAB308',
  '#06B6D4',
  '#EF4444',
];

export type MiniBarChartItem = {
  label: string;
  value: number;
  /** CSS color string. Falls back to auto palette. */
  color?: string;
};

export interface MiniBarChartProps {
  data: MiniBarChartItem[];
  maxValue: number;
  /** Formatter for displayed values (e.g. currency, shorthand). */
  valueFormatter?: (val: number) => string;
  /** Show rank index on each row. Default: false. */
  showRank?: boolean;
}

/**
 * Premium MiniBarChart.
 *
 * Merge strategy:
 * - API (maxValue, valueFormatter, MiniBarChartItem) — from codebase
 * - CSS variables (var(--muted), var(--text))     — from codebase (dark mode safe)
 * - height:'100%' fix + Shine glass overlay        — from new code (correct render)
 * - Gradient cc opacity + glow shadow              — from new code (better aesthetics)
 */
export function MiniBarChart({
  data,
  maxValue,
  valueFormatter,
  showRank = false,
}: MiniBarChartProps) {
  const format =
    valueFormatter ?? ((val: number) => val.toLocaleString('vi-VN'));

  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d, i) => {
        const color = d.color ?? PALETTE[i % PALETTE.length]!;
        const pct =
          maxValue > 0 ? Math.min((d.value / maxValue) * 100, 100) : 0;

        return (
          <div key={i} className="flex items-center gap-2.5">
            {/* Rank — từ codebase */}
            {showRank && (
              <span className="text-[11px] font-bold text-[var(--muted)] w-4 text-right shrink-0">
                {i + 1}
              </span>
            )}

            {/* Label — fixed width + truncate */}
            <span
              className="w-[100px] max-w-[100px] text-[13px] text-[var(--muted)] shrink-0 truncate"
              title={d.label}
            >
              {d.label}
            </span>

            {/* Track */}
            <div className="flex-1 h-2.5 bg-[rgba(16,35,61,0.07)] rounded-full relative">
              {/* Fill — full opacity gradient, shine removed for light backgrounds */}
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}dd, ${color})`,
                  boxShadow: `0 1px 6px ${color}44`,
                }}
              />
            </div>

            {/* Value — CSS var từ codebase, formatter từ codebase */}
            <span
              className="text-[13px] font-bold min-w-[52px] text-right shrink-0 tabular-nums"
              style={{ color }}
            >
              {format(d.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
