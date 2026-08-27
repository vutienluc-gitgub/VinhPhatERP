import { InvalidVapidPublicKeyError } from '@/features/notifications/domain/notification-errors';

export class VapidKeyValidator {
  /**
   * Decodes a Base64/Base64URL string into a Uint8Array
   */
  static decodeBase64Url(base64UrlString: string): Uint8Array {
    if (!base64UrlString || typeof base64UrlString !== 'string') {
      throw new InvalidVapidPublicKeyError(
        'VAPID public key string is empty or invalid.',
      );
    }

    try {
      const padding = '='.repeat((4 - (base64UrlString.length % 4)) % 4);
      const base64 = (base64UrlString + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    } catch (err) {
      throw new InvalidVapidPublicKeyError(
        'Failed to decode Base64URL string for VAPID key.',
        err,
      );
    }
  }

  /**
   * Validates that decoded bytes form a valid Uncompressed NIST P-256 EC Public Key:
   * 1. Byte length must be exactly 65 (0x04 + 32 bytes X + 32 bytes Y).
   * 2. First byte must be 0x04 (uncompressed point indicator).
   */
  static validateP256Bytes(bytes: Uint8Array): void {
    if (bytes.byteLength !== 65) {
      throw new InvalidVapidPublicKeyError(
        `Invalid P-256 public key length: expected 65 bytes, got ${bytes.byteLength} bytes.`,
      );
    }

    if ((bytes[0] ?? 0) !== 0x04) {
      throw new InvalidVapidPublicKeyError(
        `Invalid P-256 public key format: first byte must be 0x04, got 0x${(bytes[0] ?? 0).toString(16)}.`,
      );
    }
  }

  /**
   * Complete validation pipeline: Base64URL string -> Decoded -> Validated NIST P-256 Uint8Array
   */
  static getValidatedApplicationServerKey(base64UrlKey: string): Uint8Array {
    const bytes = this.decodeBase64Url(base64UrlKey);
    this.validateP256Bytes(bytes);
    return bytes;
  }
}
