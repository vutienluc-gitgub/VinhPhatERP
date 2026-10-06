import { describe, expect, it } from 'vitest';

import {
  hasRenewablePasskeySession,
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

describe('hasRenewablePasskeySession', () => {
  it('is true for a passkey session with an owned refresh token', () => {
    expect(
      hasRenewablePasskeySession({
        access_token: 'header.payload.sig',
        refresh_token: 'pkrt_abc',
        user: { app_metadata: { provider: 'passkey' } },
      }),
    ).toBe(true);
  });

  it('is false for the sentinel (no renewable token)', () => {
    expect(
      hasRenewablePasskeySession({
        access_token: 'header.payload.sig',
        refresh_token: PASSKEY_NO_REFRESH_TOKEN,
        user: { app_metadata: { provider: 'passkey' } },
      }),
    ).toBe(false);
  });

  it('is false for a legacy session where refresh === access', () => {
    const token = 'header.payload.sig';
    expect(
      hasRenewablePasskeySession({
        access_token: token,
        refresh_token: token,
      }),
    ).toBe(false);
  });

  it('is false for a normal GoTrue session', () => {
    expect(
      hasRenewablePasskeySession({
        access_token: 'header.payload.sig',
        refresh_token: 'pkrt_abc',
        user: { app_metadata: { provider: 'email' } },
      }),
    ).toBe(false);
  });

  it('is false for empty sessions', () => {
    expect(hasRenewablePasskeySession(null)).toBe(false);
    expect(hasRenewablePasskeySession({})).toBe(false);
  });
});
