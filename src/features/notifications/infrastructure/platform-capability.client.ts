import type { PlatformCapabilities } from '@/features/notifications/domain/notification.types';

export class PlatformCapabilityClient {
  /**
   * Evaluates all browser and hardware capabilities for Web Push, App Badging and Standalone PWA
   */
  static getCapabilities(): PlatformCapabilities {
    if (typeof window === 'undefined') {
      return {
        hasServiceWorker: false,
        hasPushManager: false,
        hasNotification: false,
        hasAppBadging: false,
        isStandalone: false,
        isIOS: false,
        isAndroid: false,
        isDesktop: false,
        isFullySupported: false,
      };
    }

    const ua = navigator.userAgent || '';
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    const isDesktop = !isIOS && !isAndroid;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator &&
        (navigator as unknown as { standalone: boolean }).standalone === true);

    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const hasNotification = 'Notification' in window;
    const hasAppBadging = 'setAppBadge' in navigator;

    // iOS 16.4+ requires Standalone PWA (Add to Home Screen) for Push
    const isPushSupportedOnPlatform = isIOS
      ? isStandalone && hasServiceWorker && hasPushManager && hasNotification
      : hasServiceWorker && hasPushManager && hasNotification;

    return {
      hasServiceWorker,
      hasPushManager,
      hasNotification,
      hasAppBadging,
      isStandalone,
      isIOS,
      isAndroid,
      isDesktop,
      isFullySupported: Boolean(isPushSupportedOnPlatform),
    };
  }

  /**
   * Helper to detect platform name for telemetry
   */
  static detectPlatformName(): 'ios' | 'android' | 'desktop' | 'unknown' {
    const caps = this.getCapabilities();
    if (caps.isIOS) return 'ios';
    if (caps.isAndroid) return 'android';
    if (caps.isDesktop) return 'desktop';
    return 'unknown';
  }

  /**
   * Helper to detect browser name
   */
  static detectBrowserName():
    | 'safari'
    | 'chrome'
    | 'firefox'
    | 'edge'
    | 'unknown' {
    if (typeof window === 'undefined') return 'unknown';
    const ua = navigator.userAgent || '';
    if (/Edg/.test(ua)) return 'edge';
    if (/Firefox/.test(ua)) return 'firefox';
    if (/Chrome/.test(ua)) return 'chrome';
    if (/Safari/.test(ua)) return 'safari';
    return 'unknown';
  }
}
