import { describe, expect, it } from 'vitest';

import { isPasskeySupported } from '@/shared/hooks/usePasskeyAuth';

describe('Passkey / WebAuthn Client Support', () => {
  it('detects WebAuthn browser support safely without throwing', () => {
    const supported = isPasskeySupported();
    expect(typeof supported).toBe('boolean');
  });
});
