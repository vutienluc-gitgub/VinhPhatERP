import { BadgeCalculator } from '@/features/notifications/domain/badge-calculator';

export class BadgeService {
  /**
   * Sets app badge counter on device icon (PWA Standalone & Desktop)
   */
  static async setBadge(count: number): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('setAppBadge' in navigator)) {
      return false;
    }

    const sanitizedCount = BadgeCalculator.sanitizeBadgeCount(count);

    try {
      if (sanitizedCount > 0) {
        await navigator.setAppBadge(sanitizedCount);
      } else if ('clearAppBadge' in navigator) {
        await navigator.clearAppBadge();
      }
      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.debug('[BadgeService] setBadge exception:', err);
      return false;
    }
  }

  /**
   * Clears app badge counter
   */
  static async clearBadge(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('clearAppBadge' in navigator)) {
      return false;
    }

    try {
      await navigator.clearAppBadge();
      return true;
    } catch {
      return false;
    }
  }
}
