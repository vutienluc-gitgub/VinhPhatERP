import { beforeEach, describe, expect, it, vi } from 'vitest';

import { signInWithPasskey } from '@/shared/hooks/usePasskeyAuth';
import { PASSKEY_NO_REFRESH_TOKEN } from '@/shared/lib/session-kind';
import { clearPasskeyMeta } from '@/features/auth/passkey-session.client';

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

function mockFetch(session: Record<string, unknown> = {}) {
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
            session: { access_token: 'header.payload.sig', ...session },
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

  it('stores a sentinel refresh token when the server returns none', async () => {
    await signInWithPasskey('NV001');

    expect(setSession).toHaveBeenCalledWith({
      access_token: 'header.payload.sig',
      refresh_token: PASSKEY_NO_REFRESH_TOKEN,
    });
    // The access token must not be reused as a refresh token.
    const arg = setSession.mock.calls[0]![0];
    expect(arg.refresh_token).not.toBe(arg.access_token);
  });

  it('stores the real refresh token and metadata when the server provides one', async () => {
    window.localStorage.clear();
    vi.stubGlobal(
      'fetch',
      mockFetch({ refresh_token: 'pkrt_real-token', family_id: 'fam-1' }),
    );

    await signInWithPasskey('NV001');

    expect(setSession).toHaveBeenCalledWith({
      access_token: 'header.payload.sig',
      refresh_token: 'pkrt_real-token',
    });

    const meta = JSON.parse(
      window.localStorage.getItem('vinhphat_passkey_meta') || '{}',
    );
    expect(meta).toEqual({ credentialId: 'cred-1', familyId: 'fam-1' });
    clearPasskeyMeta();
  });

  it('surfaces a setSession failure', async () => {
    setSession.mockResolvedValue({ error: { message: 'boom' } });
    await expect(signInWithPasskey('NV001')).rejects.toThrow(
      /phiên đăng nhập/i,
    );
  });
});
