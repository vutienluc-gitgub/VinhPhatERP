import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useViewModePreference } from '@/shared/hooks/useViewModePreference';

describe('useViewModePreference', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('returns default mode if localStorage is empty', () => {
    const { result } = renderHook(() =>
      useViewModePreference('test-module', 'table'),
    );

    expect(result.current[0]).toBe('table');
  });

  it('updates mode and saves to localStorage', () => {
    const { result } = renderHook(() =>
      useViewModePreference<'table' | 'grid'>('test-module', 'table'),
    );

    act(() => {
      result.current[1]('grid');
    });

    expect(result.current[0]).toBe('grid');
    expect(window.localStorage.getItem('vp_view_mode_test-module')).toBe(
      'grid',
    );
  });

  it('initializes from existing localStorage value', () => {
    window.localStorage.setItem('vp_view_mode_my-screen', 'grid');

    const { result } = renderHook(() =>
      useViewModePreference('my-screen', 'table'),
    );

    expect(result.current[0]).toBe('grid');
  });
});
