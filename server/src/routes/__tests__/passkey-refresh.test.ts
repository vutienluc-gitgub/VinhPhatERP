import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rotateRefreshToken, revokeFamily, buildSession, issueRefreshToken } =
  vi.hoisted(() => ({
    rotateRefreshToken: vi.fn(),
    revokeFamily: vi.fn(),
    buildSession: vi.fn(),
    issueRefreshToken: vi.fn(),
  }));

vi.mock('../../db/supabase.js', () => ({
  serverSupabase: { from: () => ({ insert: vi.fn() }), rpc: vi.fn() },
}));

vi.mock('../../services/passkey-token.service.js', async (orig) => {
  const actual =
    await orig<typeof import('../../services/passkey-token.service.js')>();
  return {
    ...actual,
    PasskeyTokenService: {
      rotateRefreshToken,
      revokeFamily,
      issueRefreshToken,
    },
  };
});

vi.mock('../../services/passkey-session.service.js', () => ({
  PasskeySessionService: { buildSession },
}));

import passkeyRouter from '../passkey.js';

function makeApp() {
  const app = new Hono();
  app.route('/auth/passkey', passkeyRouter);
  return app;
}

function post(path: string, body: unknown) {
  return makeApp().request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /auth/passkey/refresh', () => {
  beforeEach(() => {
    rotateRefreshToken.mockReset();
    buildSession.mockReset();
    buildSession.mockResolvedValue({
      access_token: 'new.access.token',
      token_type: 'bearer',
      expires_in: 604800,
    });
  });

  it('rejects a missing refresh_token or credential_id', async () => {
    expect((await post('/auth/passkey/refresh', {})).status).toBe(400);
    expect(
      (await post('/auth/passkey/refresh', { refresh_token: 'pkrt_x' })).status,
    ).toBe(400);
  });

  it('returns a fresh access + refresh pair on success', async () => {
    rotateRefreshToken.mockResolvedValue({
      status: 'rotated',
      userId: 'user-1',
      credentialId: 'cred-1',
      familyId: 'fam-1',
      token: 'pkrt_new',
    });

    const res = await post('/auth/passkey/refresh', {
      refresh_token: 'pkrt_old',
      credential_id: 'cred-1',
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.access_token).toBe('new.access.token');
    expect(body.refresh_token).toBe('pkrt_new');
    expect(body.family_id).toBe('fam-1');
    expect(buildSession).toHaveBeenCalledWith('user-1', 'cred-1');
  });

  it('answers 401 with a reuse code when the token was already consumed', async () => {
    rotateRefreshToken.mockResolvedValue({ status: 'reuse' });

    const res = await post('/auth/passkey/refresh', {
      refresh_token: 'pkrt_old',
      credential_id: 'cred-1',
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('refresh_reuse');
    expect(buildSession).not.toHaveBeenCalled();
  });

  it('answers 401 for an expired token', async () => {
    rotateRefreshToken.mockResolvedValue({ status: 'expired' });
    const res = await post('/auth/passkey/refresh', {
      refresh_token: 'pkrt_old',
      credential_id: 'cred-1',
    });
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('expired');
  });

  it('answers 503, not 401, when the RPC is not deployed', async () => {
    rotateRefreshToken.mockResolvedValue({ status: 'not_configured' });
    const res = await post('/auth/passkey/refresh', {
      refresh_token: 'pkrt_old',
      credential_id: 'cred-1',
    });
    expect(res.status).toBe(503);
  });
});

describe('POST /auth/passkey/logout', () => {
  beforeEach(() => {
    revokeFamily.mockReset();
    revokeFamily.mockResolvedValue(2);
  });

  it('requires a family_id', async () => {
    expect((await post('/auth/passkey/logout', {})).status).toBe(400);
  });

  it('revokes the family and reports the count', async () => {
    const res = await post('/auth/passkey/logout', { family_id: 'fam-1' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, revoked: 2 });
    expect(revokeFamily).toHaveBeenCalledWith('fam-1');
  });
});
