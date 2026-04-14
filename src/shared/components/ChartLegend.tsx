import type { CSSProperties } from 'react';

export type LegendItem = {
  label: string;
  color: 'primary' | 'success' | 'danger' | 'warning' | 'muted' | string;
  tooltip?: string;
};

type ChartLegendProps = {
  items: LegendItem[];
  className?: string;
  prefixText?: string;
};

export function ChartLegend({
  items,
  className = '',
  prefixText,
}: ChartLegendProps) {
  return (
    <div className={`chart-legend ${className}`}>
      {prefixText && <span className="legend-prefix">{prefixText}</span>}
      {items.map((item, i) => {
        const isSemantic = [
          'primary',
          'success',
          'danger',
          'warning',
          'muted',
        ].includes(item.color);
        const dotClass = isSemantic
          ? `legend-dot is-${item.color}`
          : 'legend-dot';
        const customStyle: CSSProperties = !isSemantic
          ? { background: item.color }
          : {};

        return (
          <span key={i} className="legend-item">
            <span className={dotClass} style={customStyle} />
            <span>{item.label}</span>
            {item.tooltip && (
              <span className="legend-tooltip">{item.tooltip}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
