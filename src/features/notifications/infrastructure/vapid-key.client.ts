import { resolveVapidPublicKey } from '@/shared/constants/notifications';
import { VapidKeyValidator } from '@/features/notifications/infrastructure/vapid-key-validator';

export class VapidKeyClient {
  /**
   * Returns the raw base64url string from environment or authoritative constant
   */
  static getPublicKeyString(): string {
    return resolveVapidPublicKey();
  }

  /**
   * Returns validated 65-byte NIST P-256 application server key for PushManager
   */
  static getApplicationServerKey(): Uint8Array {
    const keyString = this.getPublicKeyString();
    return VapidKeyValidator.getValidatedApplicationServerKey(keyString);
  }
}
