import { cn } from '@/shared/utils/cn';
import { formatValue } from '@/shared/value/core/formatter';

export interface WeightCellProps {
  value: number | null | undefined;
  compact?: boolean;
  suffix?: string;
  prefix?: string;
  className?: string;
  bold?: boolean;
}

export function WeightCell({
  value,
  compact = false,
  suffix = 'kg',
  prefix,
  className,
  bold = false,
}: WeightCellProps) {
  const text = formatValue(value, { compact, suffix, prefix, decimals: 2 });

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
