import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DashboardSyncIndicator } from '@/features/dashboard/DashboardSyncIndicator';
import * as useDashboardSyncModule from '@/features/dashboard/hooks/useDashboardSync';
import { DASHBOARD_LABELS } from '@/features/dashboard/dashboard.constants';

describe('DashboardSyncIndicator', () => {
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Trực tiếp" when synced and triggers refresh on click', () => {
    vi.spyOn(useDashboardSyncModule, 'useDashboardSync').mockReturnValue({
      status: 'synced',
      statusLabel: DASHBOARD_LABELS.SYNC_LIVE,
      tooltip: DASHBOARD_LABELS.SYNC_TOOLTIP_REFRESH,
      isOnline: true,
      isSyncing: false,
      lastSyncedAt: new Date(2026, 8, 30, 9, 15),
      refresh: mockRefresh,
    });

    render(<DashboardSyncIndicator />);

    const button = screen.getByRole('button', {
      name: /bấm để làm mới dữ liệu/i,
    });
    expect(button).toBeInTheDocument();
    expect(screen.getByText(DASHBOARD_LABELS.SYNC_LIVE)).toBeInTheDocument();
    expect(screen.getByText('(09:15)')).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('renders "Đang đồng bộ..." with disabled button when syncing', () => {
    vi.spyOn(useDashboardSyncModule, 'useDashboardSync').mockReturnValue({
      status: 'syncing',
      statusLabel: DASHBOARD_LABELS.SYNC_SYNCING,
      tooltip: DASHBOARD_LABELS.SYNC_TOOLTIP_SYNCING,
      isOnline: true,
      isSyncing: true,
      lastSyncedAt: null,
      refresh: mockRefresh,
    });

    render(<DashboardSyncIndicator />);

    const button = screen.getByRole('button', { name: /đang tải dữ liệu/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(DASHBOARD_LABELS.SYNC_SYNCING)).toBeInTheDocument();
  });

  it('renders "Ngoại tuyến" with disabled button when offline', () => {
    vi.spyOn(useDashboardSyncModule, 'useDashboardSync').mockReturnValue({
      status: 'offline',
      statusLabel: DASHBOARD_LABELS.SYNC_OFFLINE,
      tooltip: DASHBOARD_LABELS.SYNC_TOOLTIP_OFFLINE,
      isOnline: false,
      isSyncing: false,
      lastSyncedAt: null,
      refresh: mockRefresh,
    });

    render(<DashboardSyncIndicator />);

    const button = screen.getByRole('button', { name: /mất kết nối mạng/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(DASHBOARD_LABELS.SYNC_OFFLINE)).toBeInTheDocument();
  });
});
