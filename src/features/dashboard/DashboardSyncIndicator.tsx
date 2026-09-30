import { memo } from 'react';
import { clsx } from 'clsx';

import { Icon } from '@/shared/components';
import { useDashboardSync } from '@/features/dashboard/hooks/useDashboardSync';

interface DashboardSyncIndicatorProps {
  className?: string;
}

/**
 * Smart Sync Indicator component for the Dashboard.
 * Displays real-time sync state (live, syncing, offline) with micro-animations
 * and supports manual refetch on click.
 */
export const DashboardSyncIndicator = memo(function DashboardSyncIndicator({
  className,
}: DashboardSyncIndicatorProps) {
  const { status, statusLabel, tooltip, isSyncing, lastSyncedAt, refresh } =
    useDashboardSync();

  const formattedTime = lastSyncedAt
    ? new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(lastSyncedAt)
    : null;

  const displayTooltip =
    formattedTime && status === 'synced'
      ? `${tooltip} (Cập nhật lúc ${formattedTime})`
      : tooltip;

  return (
    <button
      type="button"
      id="dashboard-sync-indicator"
      onClick={() => void refresh()}
      disabled={isSyncing || status === 'offline'}
      title={displayTooltip}
      aria-label={displayTooltip}
      className={clsx(
        'group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        status === 'offline' &&
          'cursor-not-allowed opacity-75 text-muted-foreground bg-surface-secondary/40',
        status === 'syncing' && 'cursor-wait text-warning bg-warning-soft/20',
        status === 'synced' &&
          'cursor-pointer hover:bg-surface-secondary/80 active:scale-95 text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      <span
        className="flex items-center justify-center w-3 h-3"
        aria-hidden="true"
      >
        {status === 'syncing' && (
          <Icon name="RotateCw" className="w-3 h-3 text-warning animate-spin" />
        )}
        {status === 'offline' && (
          <Icon name="WifiOff" className="w-3 h-3 text-danger" />
        )}
        {status === 'synced' && <span className="live-dot" />}
      </span>

      <span className="font-semibold uppercase tracking-wider text-[11px]">
        {statusLabel}
      </span>

      {formattedTime && status === 'synced' && (
        <span className="hidden sm:inline text-muted-foreground/80 font-normal lowercase text-[10px]">
          ({formattedTime})
        </span>
      )}
    </button>
  );
});
