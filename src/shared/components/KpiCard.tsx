import { memo } from 'react';
import type { ReactNode } from 'react';

import {
  formatCurrency,
  formatQuantity,
  formatValue,
} from '@/shared/value/core/formatter';

import { Icon, type IconName } from './Icon';

export type KpiVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'secondary'
  | 'info';

interface Props {
  label: string;
  value: string | number;
  icon: IconName;
  variant?: KpiVariant;
  footer?: ReactNode;
  isLoading?: boolean;
  /** (1) Mức độ biến động (VD: '15%', '2,000') */
  trendValue?: string | number;
  /** Hướng biến động để hiện mũi tên và màu sắc */
  trendDirection?: 'up' | 'down' | 'neutral';
  /** (3) Thêm khả năng tương tác, biến thẻ thành một component điều hướng */
  onClick?: () => void;
  /** (5) Định dạng số tự động hiển thị */
  formatMode?: 'number' | 'currency' | 'percent' | 'none';
}

/**
 * Premium KPI Card with glassmorphism overlay and modern styling.
 * Enhanced with trend, interactivity, and auto-formatting.
 */
export const KpiCard = memo(function KpiCard({
  label,
  value,
  icon,
  variant = 'primary',
  footer,
  isLoading,
  trendValue,
  trendDirection,
  onClick,
  formatMode = 'none',
}: Props) {
  if (isLoading) {
    return (
      <div
        className={`kpi-card-premium kpi-${variant} animate-pulse min-h-[88px] flex flex-col justify-between`}
      >
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="h-3 w-20 bg-surface-secondary rounded" />
            <div className="h-8 w-28 bg-surface-secondary rounded" />
          </div>
          <div className="w-12 h-12 bg-surface-secondary rounded-xl" />
        </div>
      </div>
    );
  }

  // 1. Tự động Formatting
  let displayValue = value;
  if (typeof value === 'number') {
    if (formatMode === 'number') {
      displayValue = formatQuantity(value);
    } else if (formatMode === 'currency') {
      // eslint-disable-next-line no-restricted-syntax
      displayValue = formatCurrency(value, { compact: false });
    } else if (formatMode === 'percent') {
      displayValue = formatValue(value, { suffix: '%' });
    }
  }

  // 2. Tương tác mượt mà
  const isClickable = !!onClick;
  const cardClasses = [
    'kpi-card-premium',
    'min-h-[88px]',
    'flex',
    'flex-col',
    'justify-between',
    'fade-up',
    `kpi-${variant}`,
    isClickable &&
      'cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]',
  ]
    .filter(Boolean)
    .join(' ');

  // 3. Xử lý UI Trend
  const renderTrend = () => {
    if (!trendValue) return null;
    const isUp = trendDirection === 'up';
    const isDown = trendDirection === 'down';

    let colorClass = 'text-muted';
    let trendIcon: IconName = 'Minus';

    if (isUp) {
      colorClass = 'text-success';
      trendIcon = 'TrendingUp';
    } else if (isDown) {
      colorClass = 'text-danger';
      trendIcon = 'TrendingDown';
    }

    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold text-xs ${colorClass}`}
      >
        <Icon name={trendIcon} size={14} />
        {trendValue}
      </span>
    );
  };

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="kpi-overlay" />
      <div className="kpi-content">
        <div className="kpi-info">
          <p className="kpi-label">{label}</p>
          <p className="kpi-value">{displayValue}</p>
        </div>
        <div className="kpi-icon-box">
          <Icon name={icon} size={32} />
        </div>
      </div>

      {(footer || trendValue) && (
        <div className="kpi-footer text-xs font-medium opacity-90 flex flex-row items-center justify-between gap-2">
          {footer ? (
            <span className="italic truncate">{footer}</span>
          ) : (
            <span />
          )}
          {renderTrend()}
        </div>
      )}
    </div>
  );
});

KpiCard.displayName = 'KpiCard';

interface GridProps {
  children: ReactNode;
  className?: string;
}

export function KpiGrid({ children, className = '' }: GridProps) {
  return <div className={`kpi-grid ${className}`}>{children}</div>;
}
