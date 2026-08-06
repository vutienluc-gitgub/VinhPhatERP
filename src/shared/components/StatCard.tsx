import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Icon, type IconName } from './Icon';

export type StatCardTone =
  | 'default'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info';

export interface StatCardProps {
  /** Label shown above the value */
  label: string;
  /** The main metric value (number, formatted text, or MoneyText component) */
  value: ReactNode;
  /** Subtext below the value */
  subtext?: string;
  /** Lucide icon name */
  icon: IconName;
  /** Visual tone — controls accent stripe color and icon background */
  tone?: StatCardTone;
  /** Optional link to detail page */
  linkTo?: string;
  /** Link label text */
  linkLabel?: string;
  /** Whether data is still loading */
  isLoading?: boolean;
}

const TONE_ICON_CLASS: Record<StatCardTone, string> = {
  default: 'portal-stat-icon',
  danger: 'portal-stat-icon portal-stat-icon--danger',
  success: 'portal-stat-icon portal-stat-icon--success',
  warning: 'portal-stat-icon portal-stat-icon--warning',
  info: 'portal-stat-icon portal-stat-icon--info',
};

const TONE_CARD_CLASS: Record<StatCardTone, string> = {
  default: 'portal-stat-card',
  danger: 'portal-stat-card portal-stat-card--danger',
  success: 'portal-stat-card portal-stat-card--success',
  warning: 'portal-stat-card portal-stat-card--warning',
  info: 'portal-stat-card portal-stat-card--info',
};

const TONE_VALUE_CLASS: Record<StatCardTone, string> = {
  default: 'portal-stat-value',
  danger: 'portal-stat-value portal-stat-value--danger',
  success: 'portal-stat-value portal-stat-value--success',
  warning: 'portal-stat-value portal-stat-value--warning',
  info: 'portal-stat-value portal-stat-value--info',
};

/**
 * Reusable metric card for B2B Portal dashboards (Customer & Supplier).
 * Uses the existing `portal.css` class system for consistency.
 */
export function StatCard({
  label,
  value,
  subtext,
  icon,
  tone = 'default',
  linkTo,
  linkLabel,
  isLoading = false,
}: StatCardProps) {
  return (
    <div className={TONE_CARD_CLASS[tone]}>
      <div className={TONE_ICON_CLASS[tone]}>
        <Icon name={icon} size={18} />
      </div>
      <p className="portal-stat-label">{label}</p>
      <p className={TONE_VALUE_CLASS[tone]}>{isLoading ? '…' : value}</p>
      {subtext && <p className="portal-stat-subtext">{subtext}</p>}
      {linkTo && (
        <Link to={linkTo} className="portal-stat-link">
          {linkLabel ?? 'Xem chi tiết'} &rarr;
        </Link>
      )}
    </div>
  );
}
