import type { ReactNode } from 'react';

import { Icon, type IconName } from './Icon';

export type KpiVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'secondary';

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
export function KpiCardPremium({
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
        className={`kpi-card-premium kpi-${variant} animate-pulse h-[140px]`}
      >
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="h-3 w-20 bg-border/50 rounded" />
            <div className="h-8 w-28 bg-border/50 rounded" />
          </div>
          <div className="w-12 h-12 bg-border/50 rounded-xl" />
        </div>
      </div>
    );
  }

  // 1. Tự động Formatting
  let displayValue = value;
  if (typeof value === 'number') {
    if (formatMode === 'number') {
      displayValue = new Intl.NumberFormat('vi-VN').format(value);
    } else if (formatMode === 'currency') {
      displayValue = `${new Intl.NumberFormat('vi-VN').format(value)} ₫`;
    } else if (formatMode === 'percent') {
      displayValue = `${value}%`;
    }
  }

  // 2. Tương tác mượt mà
  const isClickable = !!onClick;
  const cardClasses = [
    'kpi-card-premium',
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
}

interface GridProps {
  children: ReactNode;
  className?: string;
}

export function KpiGridPremium({ children, className = '' }: GridProps) {
  return <div className={`kpi-grid ${className}`}>{children}</div>;
}
