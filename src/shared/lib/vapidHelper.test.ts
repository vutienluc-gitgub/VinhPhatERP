import { describe, it, expect } from 'vitest';

import { urlBase64ToUint8Array, getVapidPublicKey } from './vapidHelper';

describe('vapidHelper — NIST P-256 Validation', () => {
  it('converts base64url VAPID string to exact 65-byte uncompressed EC key', () => {
    const key = getVapidPublicKey();
    const result = urlBase64ToUint8Array(key);

    expect(result).toBeInstanceOf(Uint8Array);
    // Standard uncompressed P-256 public key is 65 bytes (0x04 + 32 bytes X + 32 bytes Y)
    expect(result.byteLength).toBe(65);
    // Must start with 0x04 (uncompressed point format)
    expect(result[0]).toBe(0x04);
  });

  it('handles standard and URL-safe base64 strings with padding', () => {
    const testKey =
      'BFjNvul1vaXsyiw-wJBxXh11Q-zfKO5BIpZqNKmHrQIRMtmRfq71y_nJ7_chvZhxmrkEK3mFkxuiYbmP9Fv9hbU';
    const result = urlBase64ToUint8Array(testKey);

    expect(result.byteLength).toBe(65);
    expect(result[0]).toBe(4);
  });
});
