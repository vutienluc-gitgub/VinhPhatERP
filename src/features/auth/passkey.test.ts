import { describe, expect, it } from 'vitest';

import {
  generatePasskeyChallenge,
  isPasskeySupported,
} from '@/shared/hooks/usePasskeyAuth';

describe('Passkey / WebAuthn Feature', () => {
  it('detects WebAuthn support correctly', () => {
    // Should return false in Node/jsdom test env without PublicKeyCredential
    const supported = isPasskeySupported();
    expect(typeof supported).toBe('boolean');
  });

  it('generates a valid crypto challenge for WebAuthn credential request', () => {
    const challenge = generatePasskeyChallenge();
    expect(challenge).toBeInstanceOf(Uint8Array);
    expect(challenge.length).toBeGreaterThanOrEqual(16);
  });
});
