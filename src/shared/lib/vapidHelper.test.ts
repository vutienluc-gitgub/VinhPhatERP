import { describe, it, expect } from 'vitest';

import { urlBase64ToUint8Array, getVapidPublicKey } from './vapidHelper';

describe('vapidHelper', () => {
  it('converts base64 VAPID string to Uint8Array', () => {
    const testKey =
      'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBKr3qBUYIHBQFLXYp5Nksh8U';
    const result = urlBase64ToUint8Array(testKey);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns valid VAPID public key string', () => {
    const key = getVapidPublicKey();
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(10);
  });
});
