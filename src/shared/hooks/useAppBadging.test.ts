import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useAppBadging, setDeviceAppBadge } from './useAppBadging';

describe('useAppBadging & setDeviceAppBadge', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  it('calls navigator.setAppBadge when count > 0', async () => {
    const mockSetAppBadge = vi.fn().mockResolvedValue(undefined);
    const mockClearAppBadge = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(global, 'navigator', {
      value: {
        setAppBadge: mockSetAppBadge,
        clearAppBadge: mockClearAppBadge,
      },
      writable: true,
    });

    await setDeviceAppBadge(5);

    expect(mockSetAppBadge).toHaveBeenCalledWith(5);
    expect(mockClearAppBadge).not.toHaveBeenCalled();
  });

  it('calls navigator.clearAppBadge when count is 0', async () => {
    const mockSetAppBadge = vi.fn().mockResolvedValue(undefined);
    const mockClearAppBadge = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(global, 'navigator', {
      value: {
        setAppBadge: mockSetAppBadge,
        clearAppBadge: mockClearAppBadge,
      },
      writable: true,
    });

    await setDeviceAppBadge(0);

    expect(mockClearAppBadge).toHaveBeenCalled();
    expect(mockSetAppBadge).not.toHaveBeenCalled();
  });

  it('handles error gracefully when setAppBadge throws', async () => {
    const mockSetAppBadge = vi
      .fn()
      .mockRejectedValue(new Error('Permission denied'));

    Object.defineProperty(global, 'navigator', {
      value: {
        setAppBadge: mockSetAppBadge,
      },
      writable: true,
    });

    await expect(setDeviceAppBadge(10)).resolves.not.toThrow();
    expect(mockSetAppBadge).toHaveBeenCalledWith(10);
  });

  it('syncs badge in useAppBadging hook when count updates', () => {
    const mockSetAppBadge = vi.fn().mockResolvedValue(undefined);
    const mockClearAppBadge = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(global, 'navigator', {
      value: {
        setAppBadge: mockSetAppBadge,
        clearAppBadge: mockClearAppBadge,
      },
      writable: true,
    });

    const { rerender } = renderHook(
      ({ count }) => useAppBadging({ unreadCount: count }),
      { initialProps: { count: 3 } },
    );

    expect(mockSetAppBadge).toHaveBeenCalledWith(3);

    rerender({ count: 0 });
    expect(mockClearAppBadge).toHaveBeenCalled();
  });
});
