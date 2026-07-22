import { cn } from '@/shared/utils/cn';
import { formatCurrency } from '@/shared/value/core/formatter';

export interface MoneyTextProps {
  value: number | null | undefined;
  tone?: 'default' | 'muted' | 'success' | 'danger' | 'warning';
  compact?: boolean;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function MoneyText({
  value,
  tone = 'default',
  compact = false,
  suffix = 'đ',
  prefix,
  className,
}: MoneyTextProps) {
  // eslint-disable-next-line no-restricted-syntax
  const text = formatCurrency(value, { compact, suffix, prefix });

  const toneClass = {
    default: '',
    muted: 'text-muted text-sm',
    success: 'text-success font-medium',
    danger: 'text-danger font-medium',
    warning: 'text-[var(--warning)] font-medium',
  }[tone];

  return <span className={cn(toneClass, className)}>{text}</span>;
}
