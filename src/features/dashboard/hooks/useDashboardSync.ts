import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient, useIsFetching } from '@tanstack/react-query';

import { DASHBOARD_LABELS } from '@/features/dashboard/dashboard.constants';

export type DashboardSyncStatus = 'synced' | 'syncing' | 'offline';

export interface UseDashboardSyncReturn {
  status: DashboardSyncStatus;
  statusLabel: string;
  tooltip: string;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  refresh: () => Promise<void>;
}

const isDashboardQuery = (queryKey: readonly unknown[]): boolean => {
  const firstKey = queryKey[0];
  return typeof firstKey === 'string' && firstKey.startsWith('dashboard-');
};

/**
 * Hook to manage real-time synchronization state for Dashboard analytics.
 * Tracks background queries, network availability, and provides manual refresh.
 */
export function useDashboardSync(): UseDashboardSyncReturn {
  const queryClient = useQueryClient();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // 1. Browser Network State
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. React Query Fetching State
  const fetchingCount = useIsFetching({
    predicate: (query) => isDashboardQuery(query.queryKey),
  });

  const isSyncing = fetchingCount > 0 || isManualRefreshing;

  // 3. Last Synced Timestamp (recomputes when background fetching completes)
  const lastSyncedAt = useMemo(() => {
    if (fetchingCount < 0) return null;
    const queries = queryClient.getQueryCache().findAll({
      predicate: (query) => isDashboardQuery(query.queryKey),
    });
    const maxTime = queries.reduce(
      (max, q) => Math.max(max, q.state.dataUpdatedAt),
      0,
    );
    return maxTime > 0 ? new Date(maxTime) : null;
  }, [queryClient, fetchingCount]);

  // 4. Combined Status
  const status: DashboardSyncStatus = useMemo(() => {
    if (!isOnline) return 'offline';
    if (isSyncing) return 'syncing';
    return 'synced';
  }, [isOnline, isSyncing]);

  // 5. Labels & Tooltip
  const statusLabel = useMemo(() => {
    switch (status) {
      case 'offline':
        return DASHBOARD_LABELS.SYNC_OFFLINE;
      case 'syncing':
        return DASHBOARD_LABELS.SYNC_SYNCING;
      case 'synced':
      default:
        return DASHBOARD_LABELS.SYNC_LIVE;
    }
  }, [status]);

  const tooltip = useMemo(() => {
    switch (status) {
      case 'offline':
        return DASHBOARD_LABELS.SYNC_TOOLTIP_OFFLINE;
      case 'syncing':
        return DASHBOARD_LABELS.SYNC_TOOLTIP_SYNCING;
      case 'synced':
      default:
        return DASHBOARD_LABELS.SYNC_TOOLTIP_REFRESH;
    }
  }, [status]);

  // 6. Manual Refetch Action
  const refresh = useCallback(async () => {
    if (!isOnline || isManualRefreshing) return;

    setIsManualRefreshing(true);
    try {
      await queryClient.refetchQueries({
        predicate: (query) => isDashboardQuery(query.queryKey),
      });
    } finally {
      setIsManualRefreshing(false);
    }
  }, [isOnline, isManualRefreshing, queryClient]);

  return {
    status,
    statusLabel,
    tooltip,
    isOnline,
    isSyncing,
    lastSyncedAt,
    refresh,
  };
}
