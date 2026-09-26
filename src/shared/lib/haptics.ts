/**
 * Haptic Feedback Utility for Mobile Ergonomics.
 * Provides micro-vibration feedback on touch interactions when supported.
 */

export type HapticPattern = number | number[];

export const HAPTIC_PATTERNS = {
  LIGHT: 10,
  MEDIUM: 20,
  SELECTION: 12,
  SUCCESS: [10, 30, 10],
  WARNING: [15, 40, 15],
} as const;

/**
 * Triggers light haptic feedback on mobile devices.
 * Respects `prefers-reduced-motion` and degrades gracefully if unsupported.
 *
 * @param pattern Vibration pattern in milliseconds (default: 10ms light tap)
 * @returns boolean indicating whether vibration was triggered
 */
export function triggerHapticFeedback(
  pattern: HapticPattern = HAPTIC_PATTERNS.LIGHT,
): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // Respect user preference for reduced motion
  try {
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return false;
    }
  } catch {
    // If matchMedia fails or throws, ignore and continue
  }

  // Check vibration support
  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
    return false;
  }

  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}
