import { cn } from '@/shared/utils/cn';
import { formatValue } from '@/shared/value/core/formatter';

export interface DensityTextProps {
  value: number | null | undefined;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'default';
  compact?: boolean;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function DensityText({
  value,
  variant = 'default',
  compact = false,
  suffix = 'gsm',
  prefix,
  className,
}: DensityTextProps) {
  const text = formatValue(value, { compact, suffix, prefix, decimals: 0 });

  const variantClass = {
    primary: 'text-primary font-semibold',
    secondary: 'text-muted text-sm',
    success: 'text-success font-medium',
    danger: 'text-danger font-medium',
    default: '',
  }[variant];

  return <span className={cn(variantClass, className)}>{text}</span>;
}
