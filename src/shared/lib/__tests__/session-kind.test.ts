import { describe, expect, it } from 'vitest';

import {
  isPasskeySession,
  PASSKEY_NO_REFRESH_TOKEN,
} from '@/shared/lib/session-kind';

describe('isPasskeySession', () => {
  it('detects a passkey session via app_metadata.provider', () => {
    expect(
      isPasskeySession({
        access_token: 'header.payload.sig',
        refresh_token: 'some-refresh',
        user: { app_metadata: { provider: 'passkey' } },
      }),
    ).toBe(true);
  });

  it('detects the sentinel refresh token', () => {
    expect(
      isPasskeySession({
        access_token: 'header.payload.sig',
        refresh_token: PASSKEY_NO_REFRESH_TOKEN,
      }),
    ).toBe(true);
  });

  it('detects legacy sessions where refresh === access token', () => {
    const token = 'header.payload.sig';
    expect(
      isPasskeySession({ access_token: token, refresh_token: token }),
    ).toBe(true);
  });

  it('does not flag a normal GoTrue session', () => {
    expect(
      isPasskeySession({
        access_token: 'header.payload.sig',
        refresh_token: 'a-different-refresh-token',
        user: { app_metadata: { provider: 'email' } },
      }),
    ).toBe(false);
  });

  it('returns false for empty sessions', () => {
    expect(isPasskeySession(null)).toBe(false);
    expect(isPasskeySession({})).toBe(false);
    expect(isPasskeySession({ access_token: null })).toBe(false);
  });
});
