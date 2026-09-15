import { resolveVapidPublicKey } from '@/shared/constants/notifications';

/**
 * Converts a URL-safe Base64 string to a Uint8Array required by W3C PushManager.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Returns the VAPID public key configured in environment.
 * Default is the authoritative NIST P-256 prime256v1 elliptic curve public key.
 */
export function getVapidPublicKey(): string {
  return resolveVapidPublicKey();
}
