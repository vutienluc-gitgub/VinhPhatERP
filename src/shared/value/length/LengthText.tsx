import { cn } from '@/shared/utils/cn';
import { formatValue } from '@/shared/value/core/formatter';

export interface LengthTextProps {
  value: number | null | undefined;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'default';
  compact?: boolean;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function LengthText({
  value,
  variant = 'default',
  compact = false,
  suffix = 'm',
  prefix,
  className,
}: LengthTextProps) {
  const text = formatValue(value, { compact, suffix, prefix, decimals: 2 });

  const variantClass = {
    primary: 'text-primary font-semibold',
    secondary: 'text-muted text-sm',
    success: 'text-emerald-600 font-medium',
    danger: 'text-rose-600 font-medium',
    default: '',
  }[variant];

  return <span className={cn(variantClass, className)}>{text}</span>;
}
