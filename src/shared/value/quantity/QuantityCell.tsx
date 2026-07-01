import { cn } from '@/shared/utils/cn';
import { formatValue } from '@/shared/value/core/formatter';

export interface QuantityCellProps {
  value: number | null | undefined;
  compact?: boolean;
  suffix?: string;
  prefix?: string;
  className?: string;
  bold?: boolean;
}

export function QuantityCell({
  value,
  compact = false,
  suffix = '',
  prefix,
  className,
  bold = false,
}: QuantityCellProps) {
  const text = formatValue(value, { compact, suffix, prefix, decimals: 0 });

  return (
    <div
      className={cn(
        'text-right tabular-nums',
        bold && 'font-semibold',
        className,
      )}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {text}
    </div>
  );
}
