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

/**
 * True when an existing PushSubscription was minted with the currently
 * authoritative VAPID key. After a key rotation the old subscription is
 * useless: the push gateway answers VapidPkHashMismatch because the key hash in
 * the VAPID header no longer matches the one the subscription was created with.
 *
 * A missing/undecodable key is treated as matching so we never destroy a
 * subscription we cannot actually reason about.
 */
export function matchesAuthoritativeVapidKey(
  appliedKey: ArrayBuffer | ArrayBufferView | null | undefined,
): boolean {
  if (!appliedKey) return true;

  try {
    const appliedBytes =
      appliedKey instanceof ArrayBuffer
        ? new Uint8Array(appliedKey)
        : new Uint8Array(
            appliedKey.buffer,
            appliedKey.byteOffset,
            appliedKey.byteLength,
          );

    const expectedBytes = urlBase64ToUint8Array(getVapidPublicKey());
    if (appliedBytes.length !== expectedBytes.length) return false;

    for (let i = 0; i < appliedBytes.length; i++) {
      if (appliedBytes[i] !== expectedBytes[i]) return false;
    }
    return true;
  } catch {
    return true;
  }
}
