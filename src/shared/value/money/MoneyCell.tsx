import { cn } from '@/shared/utils/cn';
import { formatCurrency } from '@/shared/value/core/formatter';

export interface MoneyCellProps {
  value: number | null | undefined;
  compact?: boolean;
  suffix?: string;
  prefix?: string;
  className?: string;
  bold?: boolean;
  tone?: 'default' | 'muted' | 'success' | 'danger' | 'warning';
}

export function MoneyCell({
  value,
  compact = false,
  suffix = 'đ',
  prefix,
  className,
  bold = false,
  tone = 'default',
}: MoneyCellProps) {
  // eslint-disable-next-line no-restricted-syntax
  const text = formatCurrency(value, { compact, suffix, prefix });

  const toneClass = {
    default: '',
    muted: 'text-muted',
    success: 'text-success',
    danger: 'text-danger',
    warning: 'text-warning',
  }[tone];

  return (
    <div
      className={cn(
        'text-right tabular-nums',
        bold && 'font-semibold',
        toneClass,
        className,
      )}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {text}
    </div>
  );
}
