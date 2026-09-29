import { beforeEach, describe, expect, it, vi } from 'vitest';

const { setSession } = vi.hoisted(() => ({ setSession: vi.fn() }));

vi.mock('@/services/supabase/client', () => ({
  supabase: { auth: { setSession } },
}));

import {
  clearPasskeyMeta,
  refreshPasskeySession,
  revokePasskeySession,
  storePasskeyMeta,
} from '@/features/auth/passkey-session.client';

const META_KEY = 'vinhphat_passkey_meta';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe('refreshPasskeySession', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setSession.mockReset();
    setSession.mockResolvedValue({ error: null });
  });

  it('returns null when no credential metadata is stored', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(refreshPasskeySession('pkrt_x')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('exchanges the token and installs the new session', async () => {
    storePasskeyMeta({ credentialId: 'cred-1', familyId: 'fam-1' });
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        access_token: 'new.access',
        refresh_token: 'pkrt_new',
        expires_in: 604800,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await refreshPasskeySession('pkrt_old');

    expect(result?.refreshToken).toBe('pkrt_new');
    expect(result?.expiresAt).toBeGreaterThan(Date.now() / 1000);
    expect(setSession).toHaveBeenCalledWith({
      access_token: 'new.access',
      refresh_token: 'pkrt_new',
    });

    // The body must carry the credential id the server validates against.
    const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
    expect(body).toEqual({
      refresh_token: 'pkrt_old',
      credential_id: 'cred-1',
    });

    // Family id survives rotation.
    expect(JSON.parse(window.localStorage.getItem(META_KEY) || '{}')).toEqual({
      credentialId: 'cred-1',
      familyId: 'fam-1',
    });
  });

  it('keeps the session on a network error so an offline blip is not fatal', async () => {
    storePasskeyMeta({ credentialId: 'cred-1', familyId: 'fam-1' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(refreshPasskeySession('pkrt_old')).resolves.toBeNull();
    // Metadata must survive: the retry needs it.
    expect(window.localStorage.getItem(META_KEY)).not.toBeNull();
  });

  it('drops the metadata on a definitive 401 so we stop retrying bad tokens', async () => {
    storePasskeyMeta({ credentialId: 'cred-1', familyId: 'fam-1' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, {})));

    await expect(refreshPasskeySession('pkrt_old')).resolves.toBeNull();
    expect(window.localStorage.getItem(META_KEY)).toBeNull();
  });

  it('returns null when the server omits tokens', async () => {
    storePasskeyMeta({ credentialId: 'cred-1', familyId: 'fam-1' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, {})));

    await expect(refreshPasskeySession('pkrt_old')).resolves.toBeNull();
    expect(setSession).not.toHaveBeenCalled();
  });

  it('revokes the family on sign-out and clears the metadata', async () => {
    storePasskeyMeta({ credentialId: 'cred-1', familyId: 'fam-1' });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { success: true }));
    vi.stubGlobal('fetch', fetchMock);

    await revokePasskeySession();

    const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
    expect(body).toEqual({ family_id: 'fam-1' });
    expect(window.localStorage.getItem(META_KEY)).toBeNull();
  });

  it('does not call the server when there is no metadata', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await revokePasskeySession();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never throws when revocation fails', async () => {
    storePasskeyMeta({ credentialId: 'cred-1', familyId: 'fam-1' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(revokePasskeySession()).resolves.toBeUndefined();
  });

  it('clearPasskeyMeta removes the stored metadata', () => {
    storePasskeyMeta({ credentialId: 'cred-1', familyId: 'fam-1' });
    clearPasskeyMeta();
    expect(window.localStorage.getItem(META_KEY)).toBeNull();
  });
});
