import crypto from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { insert, rpc } = vi.hoisted(() => ({
  insert: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('../../db/supabase.js', () => ({
  serverSupabase: { from: () => ({ insert }), rpc },
}));

import {
  PasskeyTokenService,
  hashRefreshToken,
  getRefreshTokenTtlSeconds,
  DEFAULT_REFRESH_TTL_DAYS,
} from '../passkey-token.service.js';

const USER_ID = '7724bad2-5156-4015-8d64-c83097b4e31d';
const CREDENTIAL_ID = 'cred-abc';

describe('hashRefreshToken', () => {
  it('is deterministic and never returns the raw token', () => {
    const raw = 'pkrt_some-secret-value';
    const digest = hashRefreshToken(raw);
    expect(digest).toBe(hashRefreshToken(raw));
    expect(digest).not.toContain('some-secret-value');
    expect(digest).toHaveLength(64); // sha256 hex
  });
});

describe('getRefreshTokenTtlSeconds', () => {
  const original = process.env.PASSKEY_REFRESH_TTL_DAYS;

  afterEach(() => {
    if (original === undefined) delete process.env.PASSKEY_REFRESH_TTL_DAYS;
    else process.env.PASSKEY_REFRESH_TTL_DAYS = original;
  });

  it('defaults to 30 days when unset', () => {
    delete process.env.PASSKEY_REFRESH_TTL_DAYS;
    expect(getRefreshTokenTtlSeconds()).toBe(DEFAULT_REFRESH_TTL_DAYS * 86400);
  });

  it('ignores a non-positive or unparseable override', () => {
    process.env.PASSKEY_REFRESH_TTL_DAYS = '0';
    expect(getRefreshTokenTtlSeconds()).toBe(DEFAULT_REFRESH_TTL_DAYS * 86400);
    process.env.PASSKEY_REFRESH_TTL_DAYS = 'not-a-number';
    expect(getRefreshTokenTtlSeconds()).toBe(DEFAULT_REFRESH_TTL_DAYS * 86400);
  });

  it('honours a positive override', () => {
    process.env.PASSKEY_REFRESH_TTL_DAYS = '7';
    expect(getRefreshTokenTtlSeconds()).toBe(7 * 86400);
  });
});

describe('issueRefreshToken', () => {
  beforeEach(() => {
    insert.mockReset();
    insert.mockResolvedValue({ error: null });
  });

  it('persists only the hash, with a prefixed opaque token', async () => {
    const issued = await PasskeyTokenService.issueRefreshToken(
      USER_ID,
      CREDENTIAL_ID,
    );

    expect(issued.token.startsWith('pkrt_')).toBe(true);
    expect(issued.familyId).toMatch(/^[0-9a-f-]{36}$/);

    const row = insert.mock.calls[0][0];
    expect(row.token_hash).toBe(hashRefreshToken(issued.token));
    expect(row.token_hash).not.toBe(issued.token);
    expect(row.user_id).toBe(USER_ID);
    expect(row.credential_id).toBe(CREDENTIAL_ID);
    expect(row.family_id).toBe(issued.familyId);
    // Raw token must never be among the stored columns.
    expect(Object.values(row)).not.toContain(issued.token);
  });

  it('surfaces an insert failure', async () => {
    insert.mockResolvedValue({ error: { message: 'boom' } });
    await expect(
      PasskeyTokenService.issueRefreshToken(USER_ID, CREDENTIAL_ID),
    ).rejects.toThrow(/refresh token/i);
  });
});

describe('rotateRefreshToken', () => {
  beforeEach(() => {
    rpc.mockReset();
    insert.mockReset();
  });

  it('rejects a token without the prefix before touching the DB', async () => {
    const result = await PasskeyTokenService.rotateRefreshToken(
      'not-a-valid-token',
      CREDENTIAL_ID,
    );
    expect(result.status).toBe('invalid');
    expect(rpc).not.toHaveBeenCalled();
  });

  it('sends hashes, never the raw token, to the RPC', async () => {
    const raw = 'pkrt_' + crypto.randomBytes(8).toString('base64url');
    rpc.mockResolvedValue({
      data: [
        {
          status: 'rotated',
          user_id: USER_ID,
          family_id: 'fam-1',
          credential_id: CREDENTIAL_ID,
          expires_at: new Date().toISOString(),
        },
      ],
      error: null,
    });

    const result = await PasskeyTokenService.rotateRefreshToken(
      raw,
      CREDENTIAL_ID,
    );

    const args = rpc.mock.calls[0][1];
    expect(args.p_old_hash).toBe(hashRefreshToken(raw));
    expect(args.p_old_hash).not.toBe(raw);
    expect(args.p_new_hash).not.toBe(args.p_old_hash);
    expect(args.p_new_credential_id).toBe(CREDENTIAL_ID);
    expect(result.status).toBe('rotated');
    expect(result.token?.startsWith('pkrt_')).toBe(true);
    expect(result.userId).toBe(USER_ID);
  });

  it.each([
    ['reuse', 'reuse'],
    ['expired', 'expired'],
    ['invalid', 'invalid'],
  ])(
    'passes through status=%s without a new token',
    async (dbStatus, expected) => {
      rpc.mockResolvedValue({
        data: {
          status: dbStatus,
          user_id: USER_ID,
          family_id: 'fam-1',
          credential_id: CREDENTIAL_ID,
        },
        error: null,
      });

      const result = await PasskeyTokenService.rotateRefreshToken(
        'pkrt_whatever',
        CREDENTIAL_ID,
      );
      expect(result.status).toBe(expected);
      expect(result.token).toBeUndefined();
    },
  );

  it('reports not_configured when the RPC is missing (deployment gap)', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: {
        message: 'function public.rotate_passkey_refresh_token does not exist',
      },
    });

    const result = await PasskeyTokenService.rotateRefreshToken(
      'pkrt_whatever',
      CREDENTIAL_ID,
    );
    expect(result.status).toBe('not_configured');
  });

  it('reports not_configured for a PostgREST schema-cache miss (PGRST202)', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: {
        code: 'PGRST202',
        message:
          'Could not find the function public.rotate_passkey_refresh_token in the schema cache',
      },
    });

    const result = await PasskeyTokenService.rotateRefreshToken(
      'pkrt_whatever',
      CREDENTIAL_ID,
    );
    expect(result.status).toBe('not_configured');
  });

  it('does not mistake a permission-denied grant bug for a missing function', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: {
        code: '42501',
        message: 'permission denied for function rotate_passkey_refresh_token',
      },
    });

    await expect(
      PasskeyTokenService.rotateRefreshToken('pkrt_whatever', CREDENTIAL_ID),
    ).rejects.toThrow(/permission denied/);
  });
});

describe('revocation', () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it('revokeFamily returns the revoked count', async () => {
    rpc.mockResolvedValue({ data: 3, error: null });
    await expect(PasskeyTokenService.revokeFamily('fam-1')).resolves.toBe(3);
    expect(rpc).toHaveBeenCalledWith('revoke_passkey_refresh_family', {
      p_family_id: 'fam-1',
    });
  });

  it('revokeForCredential targets the credential', async () => {
    rpc.mockResolvedValue({ data: 2, error: null });
    await expect(
      PasskeyTokenService.revokeForCredential(CREDENTIAL_ID),
    ).resolves.toBe(2);
    expect(rpc).toHaveBeenCalledWith('revoke_passkey_refresh_for_credential', {
      p_credential_id: CREDENTIAL_ID,
    });
  });

  it('surfaces a revocation failure', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'nope' } });
    await expect(PasskeyTokenService.revokeFamily('fam-1')).rejects.toThrow(
      /thu h/i,
    );
  });
});
