import type { ReactNode } from 'react';

import { Icon } from '@/shared/components';

type DashCardHeaderProps = {
  title: string;
  /** Period badge text, e.g. "Tháng này", "Năm nay" */
  period?: string;
  /** Right-side action slot (link, button, etc.) */
  action?: ReactNode;
  /** Show info icon next to title */
  showInfo?: boolean;
};

/**
 * Shared header for dashboard overview cards.
 * Extracted to avoid duplicating title-row + info-icon + period-label pattern.
 */
export function DashCardHeader({
  title,
  period,
  action,
  showInfo = true,
}: DashCardHeaderProps) {
  return (
    <div className="dash-card-header">
      <div className="dash-card-title-row">
        <h3 className="dash-card-title">{title}</h3>
        {showInfo && <Icon name="Info" size={14} className="dash-info-icon" />}
      </div>
      {period && <span className="dash-period-label">{period}</span>}
      {action}
    </div>
  );
}
