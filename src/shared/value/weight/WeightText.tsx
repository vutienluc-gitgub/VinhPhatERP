import { cn } from '@/shared/utils/cn';
import { formatValue } from '@/shared/value/core/formatter';

export interface WeightTextProps {
  value: number | null | undefined;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'default';
  compact?: boolean;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function WeightText({
  value,
  variant = 'default',
  compact = false,
  suffix = 'kg',
  prefix,
  className,
}: WeightTextProps) {
  const text = formatValue(value, { compact, suffix, prefix, decimals: 2 });

  const variantClass = {
    primary: 'text-primary font-semibold',
    secondary: 'text-muted text-sm',
    success: 'text-success font-medium',
    danger: 'text-danger font-medium',
    default: '',
  }[variant];

  return <span className={cn(variantClass, className)}>{text}</span>;
}
