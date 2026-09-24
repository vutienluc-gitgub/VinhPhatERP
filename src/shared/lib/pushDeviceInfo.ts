/**
 * Device/platform detection helpers for Web Push subscriptions.
 */

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    ('standalone' in navigator &&
      (navigator as unknown as { standalone: boolean }).standalone) ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  const KEY = 'vp_device_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function detectPlatform(): string {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/macintosh|mac os x/.test(ua)) return 'macos';
  if (/windows/.test(ua)) return 'windows';
  if (/linux/.test(ua)) return 'linux';
  return 'other';
}

export function detectBrowser(): string {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent.toLowerCase();

  if (isStandaloneDisplayMode() && /iphone|ipad|ipod/.test(ua))
    return 'safari-pwa';
  if (/edg/.test(ua)) return 'edge';
  if (/chrome/.test(ua) && !/edg/.test(ua)) return 'chrome';
  if (/firefox/.test(ua)) return 'firefox';
  if (/safari/.test(ua) && !/chrome/.test(ua)) return 'safari';
  return 'other';
}

/**
 * Checks if current environment is iOS Safari non-PWA (needs Add to Home Screen first).
 * iOS only allows Web Push from an installed Home Screen PWA.
 */
export function isIOSNonStandalone(): boolean {
  if (typeof navigator === 'undefined') return false;
  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  return isIOS && !isStandaloneDisplayMode();
}
