import { VapidKeyValidator } from '@/features/notifications/infrastructure/vapid-key-validator';

export class VapidKeyClient {
  private static readonly DEFAULT_PUBLIC_KEY =
    'BFjNvul1vaXsyiw-wJBxXh11Q-zfKO5BIpZqNKmHrQIRMtmRfq71y_nJ7_chvZhxmrkEK3mFkxuiYbmP9Fv9hbU';

  /**
   * Returns the raw base64url string from environment or verified fallback
   */
  static getPublicKeyString(): string {
    return import.meta.env.VITE_VAPID_PUBLIC_KEY || this.DEFAULT_PUBLIC_KEY;
  }

  /**
   * Returns validated 65-byte NIST P-256 application server key for PushManager
   */
  static getApplicationServerKey(): Uint8Array {
    const keyString = this.getPublicKeyString();
    return VapidKeyValidator.getValidatedApplicationServerKey(keyString);
  }
}
