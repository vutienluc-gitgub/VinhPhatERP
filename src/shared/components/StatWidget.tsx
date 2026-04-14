import type { ReactNode } from 'react';

import { Icon } from './Icon';
import type { IconName } from './Icon';

type StatWidgetProps = {
  title: string;
  icon?: IconName;
  value: number | string;
  color?: 'primary' | 'amber' | 'danger' | 'success';
  subtitle?: string;
  legend?: ReactNode;
  className?: string;
  onClick?: () => void;
};

export function StatWidget({
  title,
  icon,
  value,
  color = 'amber',
  subtitle,
  legend,
  className = '',
  onClick,
}: StatWidgetProps) {
  const clickableClass = onClick
    ? 'cursor-pointer hover:-translate-y-1 transition-transform'
    : '';

  return (
    <div
      className={`stat-widget ${clickableClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="stat-widget-header">
        <div className="stat-widget-title-row">
          {icon && <Icon name={icon} size={20} />}
          <h3 className="stat-widget-title">{title}</h3>
        </div>

        {legend && <div className="stat-widget-legend">{legend}</div>}
      </div>

      <div className="stat-widget-value-row">
        <div className={`stat-widget-value is-${color}`}>{value}</div>
        {subtitle && <div className="stat-widget-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}
