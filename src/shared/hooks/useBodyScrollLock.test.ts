import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useBodyScrollLock } from './useBodyScrollLock';

describe('useBodyScrollLock', () => {
  const scrollToSpy = vi.fn();

  beforeEach(() => {
    document.body.removeAttribute('style');
    document.documentElement.removeAttribute('style');
    vi.spyOn(window, 'scrollTo').mockImplementation(scrollToSpy);
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 240,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    scrollToSpy.mockReset();
  });

  it('does nothing when not locked', () => {
    renderHook(() =>
      useBodyScrollLock(false, { preserveScrollPosition: true }),
    );

    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.position).toBe('');
  });

  it('default mode only toggles overflow', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = renderHook(() => useBodyScrollLock(true));

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.position).toBe('');

    unmount();

    expect(document.body.style.overflow).toBe('auto');
    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it('preserveScrollPosition pins body at the current scroll offset', () => {
    const { unmount } = renderHook(() =>
      useBodyScrollLock(true, { preserveScrollPosition: true }),
    );

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-240px');
    expect(document.body.style.width).toBe('100%');
    expect(document.documentElement.style.overscrollBehavior).toBe('none');

    unmount();
  });

  it('restores original styles and scroll position on unlock', () => {
    document.body.style.position = 'relative';
    const { rerender } = renderHook(
      ({ locked }) =>
        useBodyScrollLock(locked, { preserveScrollPosition: true }),
      { initialProps: { locked: true } },
    );

    rerender({ locked: false });

    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.position).toBe('relative');
    expect(document.body.style.top).toBe('');
    expect(document.documentElement.style.overscrollBehavior).toBe('');
    expect(scrollToSpy).toHaveBeenCalledWith(0, 240);
  });
});
