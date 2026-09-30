import type { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useDashboardSync } from '@/features/dashboard/hooks/useDashboardSync';
import { DASHBOARD_LABELS } from '@/features/dashboard/dashboard.constants';

describe('useDashboardSync', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.stubGlobal('navigator', { onLine: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    queryClient.clear();
  });

  it('initializes with "synced" status when online and idle', () => {
    const { result } = renderHook(() => useDashboardSync(), { wrapper });

    expect(result.current.status).toBe('synced');
    expect(result.current.statusLabel).toBe(DASHBOARD_LABELS.SYNC_LIVE);
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isSyncing).toBe(false);
  });

  it('detects offline mode when window triggers offline event', () => {
    const { result } = renderHook(() => useDashboardSync(), { wrapper });

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.status).toBe('offline');
    expect(result.current.statusLabel).toBe(DASHBOARD_LABELS.SYNC_OFFLINE);
    expect(result.current.isOnline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.status).toBe('synced');
    expect(result.current.isOnline).toBe(true);
  });

  it('triggers query refetch when calling refresh()', async () => {
    const refetchSpy = vi.spyOn(queryClient, 'refetchQueries');
    const { result } = renderHook(() => useDashboardSync(), { wrapper });

    await act(async () => {
      await result.current.refresh();
    });

    expect(refetchSpy).toHaveBeenCalled();
  });
});
