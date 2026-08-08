import { cn } from '@/shared/utils/cn';
import { Icon } from '@/shared/components/Icon';
import type { IconName } from '@/shared/components/Icon';
import { formatCurrency } from '@/shared/value/core/formatter';

export interface MoneyStatProps {
  title: string;
  value: number | null | undefined;
  icon?: IconName;
  trend?: number; // Ví dụ: 12 (nghĩa là 12%)
  trendDirection?: 'up' | 'down';
  subtitle?: string;
  className?: string;
  tone?: 'default' | 'primary' | 'success' | 'danger' | 'warning';
}

export function MoneyStat({
  title,
  value,
  icon,
  trend,
  trendDirection,
  subtitle,
  className,
  tone = 'default',
}: MoneyStatProps) {
  // eslint-disable-next-line no-restricted-syntax
  const text = formatCurrency(value, { compact: false, suffix: '' });

  const bgClass = {
    default: 'bg-[var(--surface)] border-[var(--border)]',
    primary: 'bg-indigo-50 border-info',
    success: 'bg-emerald-50 border-success',
    danger: 'bg-rose-50 border-danger',
    warning: 'bg-amber-50 border-warning',
  }[tone];

  const iconColorClass = {
    default: 'text-muted-foreground bg-surface-secondary',
    primary: 'text-info bg-info-soft',
    success: 'text-success bg-success-soft',
    danger: 'text-danger bg-danger-soft',
    warning: 'text-warning bg-warning-soft',
  }[tone];

  return (
    <div
      className={cn('rounded-xl border p-5 flex flex-col', bgClass, className)}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        {icon && (
          <div className={cn('p-2 rounded-lg', iconColorClass)}>
            <Icon name={icon} size={20} />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
          {text}
        </span>
        <span className="text-sm font-semibold text-muted-foreground">đ</span>
      </div>

      {(trend !== undefined || subtitle) && (
        <div className="flex items-center gap-2 mt-3 text-sm">
          {trend !== undefined && (
            <span
              className={cn(
                'flex items-center font-medium',
                trendDirection === 'up' || trend > 0
                  ? 'text-success'
                  : 'text-danger',
              )}
            >
              <Icon
                name={
                  trendDirection === 'up' || trend > 0
                    ? 'TrendingUp'
                    : 'TrendingDown'
                }
                size={14}
                className="mr-1"
              />
              {Math.abs(trend)}%
            </span>
          )}
          {subtitle && (
            <span className="text-muted-foreground">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
