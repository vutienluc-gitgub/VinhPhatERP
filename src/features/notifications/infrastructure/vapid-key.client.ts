import { VapidKeyValidator } from '@/features/notifications/infrastructure/vapid-key-validator';

export class VapidKeyClient {
  private static readonly DEFAULT_PUBLIC_KEY =
    'BElJS1biXMms_8auV6_QTwt4Dy0mI36FdcwAk7sR2Cw5h2PJ9Qv-lmeeMDRraW_VVpVCLH3DaMIAapuljw0QQTY';

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
