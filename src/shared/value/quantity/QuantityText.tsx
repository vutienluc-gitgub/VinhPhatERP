import { cn } from '@/shared/utils/cn';
import { formatValue } from '@/shared/value/core/formatter';

export interface QuantityTextProps {
  value: number | null | undefined;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'default';
  compact?: boolean;
  suffix?: string;
  prefix?: string;
  className?: string;
  decimals?: number;
}

export function QuantityText({
  value,
  variant = 'default',
  compact = false,
  suffix = '',
  prefix,
  className,
  decimals = 0,
}: QuantityTextProps) {
  const text = formatValue(value, { compact, suffix, prefix, decimals });

  const variantClass = {
    primary: 'text-foreground font-semibold',
    secondary: 'text-muted-foreground text-sm',
    success: 'text-success font-medium',
    danger: 'text-danger font-medium',
    default: '',
  }[variant];

  return <span className={cn(variantClass, className)}>{text}</span>;
}
