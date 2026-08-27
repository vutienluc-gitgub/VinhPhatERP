import { useCallback, useEffect } from 'react';

/**
 * Low-level utility to set or clear the App Icon Badge on iOS (16.4+ Standalone PWA),
 * Android, and Desktop browsers.
 */
export async function setDeviceAppBadge(count: number): Promise<void> {
  if (typeof navigator === 'undefined') return;

  try {
    if ('setAppBadge' in navigator && count > 0) {
      await navigator.setAppBadge(count);
    } else if ('clearAppBadge' in navigator) {
      await navigator.clearAppBadge();
    }
  } catch (err) {
    // Gracefully handle browser/OS permission errors or unsupported environments
    const message = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.debug('[AppBadging] setDeviceAppBadge failed:', message);
  }
}

export interface UseAppBadgingOptions {
  unreadCount?: number;
  autoSync?: boolean;
}

/**
 * Hook to synchronize the App Icon Badge with unread counters.
 * Listens to unread count changes, window focus, and document visibility changes.
 */
export function useAppBadging(options: UseAppBadgingOptions = {}) {
  const { unreadCount = 0, autoSync = true } = options;

  const updateBadge = useCallback(async (count: number) => {
    await setDeviceAppBadge(count);
  }, []);

  const clearBadge = useCallback(async () => {
    await setDeviceAppBadge(0);
  }, []);

  // Synchronize badge whenever unreadCount changes
  useEffect(() => {
    if (!autoSync) return;
    void setDeviceAppBadge(unreadCount);
  }, [unreadCount, autoSync]);

  // Re-sync on window focus and visibility change
  useEffect(() => {
    if (!autoSync) return;

    function handleSync() {
      if (document.visibilityState === 'visible') {
        void setDeviceAppBadge(unreadCount);
      }
    }

    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);

    return () => {
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
    };
  }, [unreadCount, autoSync]);

  return {
    updateBadge,
    clearBadge,
  };
}
