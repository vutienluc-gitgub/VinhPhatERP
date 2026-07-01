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
    primary: 'bg-indigo-50 border-indigo-100',
    success: 'bg-emerald-50 border-emerald-100',
    danger: 'bg-rose-50 border-rose-100',
    warning: 'bg-amber-50 border-amber-100',
  }[tone];

  const iconColorClass = {
    default: 'text-slate-500 bg-slate-100',
    primary: 'text-indigo-600 bg-indigo-100',
    success: 'text-emerald-600 bg-emerald-100',
    danger: 'text-rose-600 bg-rose-100',
    warning: 'text-amber-600 bg-amber-100',
  }[tone];

  return (
    <div
      className={cn('rounded-xl border p-5 flex flex-col', bgClass, className)}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-slate-600">{title}</span>
        {icon && (
          <div className={cn('p-2 rounded-lg', iconColorClass)}>
            <Icon name={icon} size={20} />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
          {text}
        </span>
        <span className="text-sm font-semibold text-slate-500">đ</span>
      </div>

      {(trend !== undefined || subtitle) && (
        <div className="flex items-center gap-2 mt-3 text-sm">
          {trend !== undefined && (
            <span
              className={cn(
                'flex items-center font-medium',
                trendDirection === 'up' || trend > 0
                  ? 'text-emerald-600'
                  : 'text-rose-600',
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
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
