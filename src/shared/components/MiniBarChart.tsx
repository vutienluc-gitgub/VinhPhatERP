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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {data.map((d, i) => {
        const color = d.color ?? PALETTE[i % PALETTE.length]!;
        const pct =
          maxValue > 0 ? Math.min((d.value / maxValue) * 100, 100) : 0;

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {/* Rank — từ codebase */}
            {showRank && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  width: '16px',
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
            )}

            {/* Label — fixed width + truncate */}
            <span
              style={{
                width: '100px',
                maxWidth: '100px',
                fontSize: '13px',
                color: 'var(--muted)',
                flexShrink: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={d.label}
            >
              {d.label}
            </span>

            {/* Track */}
            <div
              style={{
                flex: 1,
                height: '10px',
                backgroundColor: 'rgba(16,35,61,0.07)',
                borderRadius: '999px',
                position: 'relative',
              }}
            >
              {/* Fill — full opacity gradient, shine removed for light backgrounds */}
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  borderRadius: '999px',
                  background: `linear-gradient(90deg, ${color}dd, ${color})`,
                  boxShadow: `0 1px 6px ${color}44`,
                  transition: 'width 0.7s ease-out',
                }}
              />
            </div>

            {/* Value — CSS var từ codebase, formatter từ codebase */}
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                minWidth: '52px',
                textAlign: 'right',
                color,
                flexShrink: 0,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {format(d.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
