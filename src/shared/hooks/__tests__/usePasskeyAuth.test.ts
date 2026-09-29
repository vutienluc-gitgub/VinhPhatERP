import { beforeEach, describe, expect, it, vi } from 'vitest';

import { signInWithPasskey } from '@/shared/hooks/usePasskeyAuth';
import { PASSKEY_NO_REFRESH_TOKEN } from '@/shared/lib/session-kind';

const { setSession, stopAutoRefresh } = vi.hoisted(() => ({
  setSession: vi.fn(),
  stopAutoRefresh: vi.fn(),
}));

vi.mock('@/services/supabase/client', () => ({
  supabase: { auth: { setSession, stopAutoRefresh } },
}));

vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: () => true,
  platformAuthenticatorIsAvailable: vi.fn().mockResolvedValue(true),
  startRegistration: vi.fn(),
  startAuthentication: vi.fn().mockResolvedValue({ id: 'cred-1' }),
}));

function mockFetch() {
  return vi.fn((url: string) => {
    if (url.includes('/login/options')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ challenge: 'abc' }),
      });
    }
    if (url.includes('/login/verify')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            session: { access_token: 'header.payload.sig' },
          }),
      });
    }
    throw new Error(`unexpected fetch: ${url}`);
  });
}

describe('signInWithPasskey — refresh token handling', () => {
  beforeEach(() => {
    setSession.mockReset();
    setSession.mockResolvedValue({ error: null });
    stopAutoRefresh.mockReset();
    vi.stubGlobal('fetch', mockFetch());
  });

  it('stores a sentinel refresh token, never the access token', async () => {
    await signInWithPasskey('NV001');

    expect(setSession).toHaveBeenCalledWith({
      access_token: 'header.payload.sig',
      refresh_token: PASSKEY_NO_REFRESH_TOKEN,
    });
    // The access token must not be reused as a refresh token.
    const arg = setSession.mock.calls[0]![0];
    expect(arg.refresh_token).not.toBe(arg.access_token);
  });

  it('surfaces a setSession failure', async () => {
    setSession.mockResolvedValue({ error: { message: 'boom' } });
    await expect(signInWithPasskey('NV001')).rejects.toThrow(
      /phiên đăng nhập/i,
    );
  });
});
