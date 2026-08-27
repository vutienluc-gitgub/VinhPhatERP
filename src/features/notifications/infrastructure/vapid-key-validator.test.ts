import { describe, it, expect } from 'vitest';

import { InvalidVapidPublicKeyError } from '@/features/notifications/domain/notification-errors';

import { VapidKeyValidator } from './vapid-key-validator';
import { VapidKeyClient } from './vapid-key.client';

describe('VapidKeyValidator (Fail-Fast NIST P-256 Validation)', () => {
  it('successfully validates and returns 65-byte array for verified VAPID key', () => {
    const validKey = VapidKeyClient.getPublicKeyString();
    const result = VapidKeyValidator.getValidatedApplicationServerKey(validKey);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.byteLength).toBe(65);
    expect(result[0]).toBe(0x04);
  });

  it('throws InvalidVapidPublicKeyError when key string is empty', () => {
    expect(() => {
      VapidKeyValidator.getValidatedApplicationServerKey('');
    }).toThrow(InvalidVapidPublicKeyError);
  });

  it('throws InvalidVapidPublicKeyError when decoded bytes length is not 65', () => {
    // 10 bytes base64 string
    const shortKey = window.btoa('shortkey12');
    expect(() => {
      VapidKeyValidator.getValidatedApplicationServerKey(shortKey);
    }).toThrow(InvalidVapidPublicKeyError);
  });

  it('throws InvalidVapidPublicKeyError when first byte is not 0x04', () => {
    const invalidPrefixBytes = new Uint8Array(65);
    invalidPrefixBytes[0] = 0x02; // Compressed point or invalid

    expect(() => {
      VapidKeyValidator.validateP256Bytes(invalidPrefixBytes);
    }).toThrow(InvalidVapidPublicKeyError);
  });
});
