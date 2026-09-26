import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HAPTIC_PATTERNS, triggerHapticFeedback } from '@/shared/lib/haptics';

describe('haptics utility', () => {
  const originalNavigator = global.navigator;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
    window.matchMedia = originalMatchMedia;
  });

  it('returns false when navigator.vibrate is not available', () => {
    Object.defineProperty(global, 'navigator', {
      value: {},
      configurable: true,
      writable: true,
    });

    const result = triggerHapticFeedback();
    expect(result).toBe(false);
  });

  it('triggers vibration when navigator.vibrate is supported', () => {
    const vibrateMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(global, 'navigator', {
      value: { vibrate: vibrateMock },
      configurable: true,
      writable: true,
    });

    const result = triggerHapticFeedback(HAPTIC_PATTERNS.LIGHT);
    expect(vibrateMock).toHaveBeenCalledWith(HAPTIC_PATTERNS.LIGHT);
    expect(result).toBe(true);
  });

  it('does not vibrate if user prefers reduced motion', () => {
    const vibrateMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(global, 'navigator', {
      value: { vibrate: vibrateMock },
      configurable: true,
      writable: true,
    });

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const result = triggerHapticFeedback(HAPTIC_PATTERNS.SELECTION);
    expect(vibrateMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('handles errors gracefully if vibrate throws', () => {
    const vibrateMock = vi.fn().mockImplementation(() => {
      throw new Error('NotAllowedError');
    });
    Object.defineProperty(global, 'navigator', {
      value: { vibrate: vibrateMock },
      configurable: true,
      writable: true,
    });

    const result = triggerHapticFeedback();
    expect(result).toBe(false);
  });
});
