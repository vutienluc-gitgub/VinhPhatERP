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

  describe('with a scrollable .shell-layout (mobile scroll owner)', () => {
    let shell: HTMLDivElement;

    beforeEach(() => {
      shell = document.createElement('div');
      shell.className = 'shell-layout';
      shell.style.overflow = 'auto';
      shell.scrollTop = 150;
      document.body.appendChild(shell);
    });

    afterEach(() => {
      document.body.removeChild(shell);
    });

    it('freezes the container in default mode and restores it', () => {
      const { unmount } = renderHook(() => useBodyScrollLock(true));

      expect(shell.style.overflow).toBe('hidden');
      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(shell.style.overflow).toBe('auto');
    });

    it('captures the container offset and restores it when unlocked', () => {
      const { rerender } = renderHook(
        ({ locked }) =>
          useBodyScrollLock(locked, { preserveScrollPosition: true }),
        { initialProps: { locked: true } },
      );

      // Offset comes from the container, not window.scrollY (~0 on mobile).
      expect(document.body.style.top).toBe('-150px');
      expect(shell.style.overflow).toBe('hidden');
      expect(shell.scrollTop).toBe(0);

      rerender({ locked: false });

      expect(shell.scrollTop).toBe(150);
      expect(shell.style.overflow).toBe('auto');
      expect(scrollToSpy).not.toHaveBeenCalled();
    });

    it('ignores the container on desktop (not a scroller) and uses window scroll', () => {
      // Desktop: .shell-layout keeps default overflow: visible, body scrolls.
      shell.scrollTop = 0;
      shell.style.overflow = 'visible';

      const { rerender } = renderHook(
        ({ locked }) =>
          useBodyScrollLock(locked, { preserveScrollPosition: true }),
        { initialProps: { locked: true } },
      );

      expect(shell.style.overflow).not.toBe('hidden');
      expect(document.body.style.top).toBe('-240px');

      rerender({ locked: false });

      expect(scrollToSpy).toHaveBeenCalledWith(0, 240);
    });

    it('does not touch the container when the selector is disabled', () => {
      const { unmount } = renderHook(() =>
        useBodyScrollLock(true, {
          preserveScrollPosition: true,
          scrollContainerSelector: null,
        }),
      );

      expect(shell.style.overflow).toBe('auto');
      expect(document.body.style.top).toBe('-240px');

      unmount();
    });
  });
});
