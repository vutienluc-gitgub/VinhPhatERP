import crypto from 'node:crypto';

import { serverSupabase } from '../db/supabase.js';

/**
 * Refresh tokens for passkey sessions.
 *
 * Access tokens are minted by our own Hono API (`mintSupabaseJwt`), not by
 * GoTrue, so GoTrue cannot renew them. This service owns a second, opaque token
 * that the client stores and exchanges at `/auth/passkey/refresh`.
 *
 * Security properties:
 *   * the raw token is never persisted — only its SHA-256 hash;
 *   * rotation is atomic (see `rotate_passkey_refresh_token` migration RPC);
 *   * tokens are grouped in families, and replaying a consumed member revokes
 *     the whole family.
 */

/** 256 bits of entropy, base64url so it is URL- and header-safe. */
const REFRESH_TOKEN_BYTES = 32;

export const DEFAULT_REFRESH_TTL_DAYS = 30;

/** Sentinel embedded in the refresh token so a stray value is identifiable. */
const TOKEN_PREFIX = 'pkrt_';

export type RotateStatus =
  | 'rotated'
  | 'reuse'
  | 'expired'
  | 'invalid'
  | 'not_configured';

export interface IssuedRefreshToken {
  /** Raw token, returned to the client exactly once. */
  token: string;
  familyId: string;
  expiresAt: Date;
}

export interface RotatedRefreshToken {
  status: RotateStatus;
  userId?: string;
  familyId?: string;
  credentialId?: string;
  /** Present only when `status === 'rotated'`. */
  token?: string;
  expiresAt?: Date;
}

function getRefreshTtlDays(): number {
  const raw = Number(process.env.PASSKEY_REFRESH_TTL_DAYS);
  // A non-positive or unparseable value must not mint an already-dead token.
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_REFRESH_TTL_DAYS;
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

function generateRefreshToken(): string {
  return (
    TOKEN_PREFIX + crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('base64url')
  );
}

function expiresInSeconds(days: number): number {
  return Math.floor(days * 24 * 60 * 60);
}

/** TTL of a freshly issued refresh token, in seconds — surfaced to the client. */
export function getRefreshTokenTtlSeconds(): number {
  return expiresInSeconds(getRefreshTtlDays());
}

export class PasskeyTokenService {
  /**
   * Issue the first refresh token of a new family (called on passkey login).
   */
  static async issueRefreshToken(
    userId: string,
    credentialId: string,
    familyId: string = crypto.randomUUID(),
  ): Promise<IssuedRefreshToken> {
    const token = generateRefreshToken();
    const expiresAt = new Date(
      Date.now() + getRefreshTtlDays() * 24 * 60 * 60 * 1000,
    );

    const { error } = await serverSupabase
      .from('passkey_refresh_tokens')
      .insert({
        user_id: userId,
        credential_id: credentialId,
        token_hash: hashRefreshToken(token),
        family_id: familyId,
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      throw new Error('Không thể tạo refresh token: ' + error.message);
    }

    return { token, familyId, expiresAt };
  }

  /**
   * Exchange a refresh token for a new one. The old token is consumed in the
   * same locked transaction, so two concurrent presentations cannot both win.
   *
   * A `reuse` result means the presented token had already been consumed or
   * revoked — treated as compromise, and the family is revoked by the RPC.
   */
  static async rotateRefreshToken(
    rawToken: string,
    credentialId: string,
  ): Promise<RotatedRefreshToken> {
    if (!rawToken?.startsWith(TOKEN_PREFIX)) {
      return { status: 'invalid' };
    }

    const newToken = generateRefreshToken();
    const newExpiresAt = new Date(
      Date.now() + getRefreshTtlDays() * 24 * 60 * 60 * 1000,
    );

    const { data, error } = await serverSupabase.rpc(
      'rotate_passkey_refresh_token',
      {
        p_old_hash: hashRefreshToken(rawToken),
        p_new_hash: hashRefreshToken(newToken),
        p_new_expires_at: newExpiresAt.toISOString(),
        p_new_credential_id: credentialId,
      },
    );

    if (error) {
      // A missing function is a deployment gap, not an auth failure — surface it
      // distinctly so the route can answer 503 instead of a misleading 401.
      if (/function|does not exist|schema cache/i.test(error.message)) {
        return { status: 'not_configured' };
      }
      throw new Error('Không thể xoay refresh token: ' + error.message);
    }

    const row = Array.isArray(data) ? data[0] : data;
    const status = (row?.status as RotateStatus) || 'invalid';

    if (status !== 'rotated') {
      return {
        status,
        userId: row?.user_id ?? undefined,
        familyId: row?.family_id ?? undefined,
        credentialId: row?.credential_id ?? undefined,
      };
    }

    // The RPC returns the *requested* credential id, so trust the caller's for
    // the response and let the RPC have enforced the match.
    return {
      status: 'rotated',
      userId: row.user_id,
      familyId: row.family_id,
      credentialId,
      token: newToken,
      expiresAt: new Date(row.expires_at),
    };
  }

  /** Revoke every live token in a family (logout). Idempotent. */
  static async revokeFamily(familyId: string): Promise<number> {
    const { data, error } = await serverSupabase.rpc(
      'revoke_passkey_refresh_family',
      { p_family_id: familyId },
    );
    if (error) {
      throw new Error('Không thể thu hồi phiên: ' + error.message);
    }
    return typeof data === 'number' ? data : 0;
  }

  /**
   * Revoke every family minted for one credential. Called when the passkey
   * itself is deleted so a removed authenticator cannot keep a session alive.
   */
  static async revokeForCredential(credentialId: string): Promise<number> {
    const { data, error } = await serverSupabase.rpc(
      'revoke_passkey_refresh_for_credential',
      { p_credential_id: credentialId },
    );
    if (error) {
      throw new Error(
        'Không thể thu hồi phiên của khóa bảo mật: ' + error.message,
      );
    }
    return typeof data === 'number' ? data : 0;
  }
}
