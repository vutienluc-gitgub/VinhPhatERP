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
}

/**
 * Premium KPI Card with glassmorphism overlay and modern styling.
 * Uses CSS classes from data-ui.css (.kpi-card-premium).
 */
export function KpiCardPremium({
  label,
  value,
  icon,
  variant = 'primary',
  footer,
  isLoading,
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

  return (
    <div className={`kpi-card-premium kpi-${variant}`}>
      <div className="kpi-overlay" />
      <div className="kpi-content">
        <div className="kpi-info">
          <p className="kpi-label">{label}</p>
          <p className="kpi-value">{value}</p>
        </div>
        <div className="kpi-icon-box">
          <Icon name={icon} size={32} />
        </div>
      </div>
      {footer && (
        <div className="kpi-footer text-xs font-medium italic opacity-90">
          {footer}
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
