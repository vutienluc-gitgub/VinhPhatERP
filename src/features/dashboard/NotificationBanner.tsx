import { Link } from 'react-router-dom';

import { Icon, Badge } from '@/shared/components';
import type { DashboardStats } from '@/application/analytics';

import { NOTIFICATION_LABELS } from './dashboard.constants';

/* ── Types ── */

type NotificationItem = {
  id: string;
  icon: string;
  label: string;
  count: number;
  href: string;
  variant: 'danger' | 'warning' | 'info';
};

type NotificationBannerProps = {
  stats: DashboardStats | undefined;
  isLoading: boolean;
};

/* ── Helpers ── */

function buildNotifications(stats: DashboardStats): NotificationItem[] {
  const items: NotificationItem[] = [];

  if (stats.overdueOrders > 0) {
    items.push({
      id: 'overdue',
      icon: 'TriangleAlert',
      label: NOTIFICATION_LABELS.OVERDUE_ORDERS,
      count: stats.overdueOrders,
      href: '/orders',
      variant: 'danger',
    });
  }

  if (stats.pendingShipments > 0) {
    items.push({
      id: 'shipments',
      icon: 'Truck',
      label: NOTIFICATION_LABELS.PENDING_SHIPMENTS,
      count: stats.pendingShipments,
      href: '/shipments',
      variant: 'warning',
    });
  }

  if (stats.draftOrders > 0) {
    items.push({
      id: 'drafts',
      icon: 'FilePenLine',
      label: NOTIFICATION_LABELS.DRAFT_ORDERS,
      count: stats.draftOrders,
      href: '/orders',
      variant: 'info',
    });
  }

  if (stats.expiringQuotations > 0) {
    items.push({
      id: 'quotations',
      icon: 'Clock',
      label: NOTIFICATION_LABELS.EXPIRING_QUOTATIONS,
      count: stats.expiringQuotations,
      href: '/quotations',
      variant: 'warning',
    });
  }

  return items;
}

/* ── Skeleton ── */

function BannerSkeleton() {
  return (
    <div className="notif-banner">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={`notif-skeleton-${String(i)}`}
          className="notif-banner-item notif-banner-skeleton"
        >
          <span className="skeleton-circle" />
          <span className="skeleton-text" />
        </div>
      ))}
    </div>
  );
}

/* ── Component ── */

export function NotificationBanner({
  stats,
  isLoading,
}: NotificationBannerProps) {
  if (isLoading) return <BannerSkeleton />;
  if (!stats) return null;

  const notifications = buildNotifications(stats);

  if (notifications.length === 0) {
    return (
      <div className="notif-banner notif-banner-clear">
        <Icon name="CircleCheck" size={18} />
        <span>{NOTIFICATION_LABELS.ALL_CLEAR}</span>
      </div>
    );
  }

  return (
    <div className="notif-banner">
      {notifications.map((item) => (
        <Link
          key={item.id}
          to={item.href}
          className={`notif-banner-item is-${item.variant}`}
          id={`notif-banner-${item.id}`}
        >
          <span className="notif-banner-icon">
            <Icon name={item.icon} size={16} />
          </span>
          <span className="notif-banner-label">{item.label}</span>
          <Badge
            variant={item.variant === 'danger' ? 'danger' : 'info'}
            className="notif-banner-count"
          >
            {item.count}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
