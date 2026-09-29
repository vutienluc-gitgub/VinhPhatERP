/**
 * Passkey sessions are minted by our own Hono API (see
 * server/src/utils/jwt.ts), not by Supabase GoTrue. GoTrue therefore does not
 * hold a refresh token for them, so supabase-js must never try to rotate one —
 * the request would be rejected and the client would silently drop the session.
 *
 * We recognise such a session by the `provider: 'passkey'` marker, and fall back
 * to the historical shape bug where the access token was reused as the refresh
 * token (both fields identical), which older sessions in storage still carry.
 */

interface SessionLike {
  access_token?: string | null;
  refresh_token?: string | null;
  user?: {
    app_metadata?: { provider?: string | null } | null;
  } | null;
}

/**
 * Stand-in `refresh_token` written for passkey sessions. It must be truthy so
 * supabase-js treats the stored session as valid, but must never look like a
 * token GoTrue could accept — hence the `passkey:` prefix. Reusing the access
 * token here (the original bug) made every rotation attempt a real request.
 */
export const PASSKEY_NO_REFRESH_TOKEN = 'passkey:no-refresh-token';

export function isPasskeySession(
  session: SessionLike | null | undefined,
): boolean {
  if (!session?.access_token) return false;
  if (session.user?.app_metadata?.provider === 'passkey') return true;
  // Sessions we minted write the sentinel; the current passkey flow may omit the
  // user object on a restored session, so this check must stand on its own.
  if (session.refresh_token === PASSKEY_NO_REFRESH_TOKEN) return true;
  // Legacy sessions: refresh_token === access_token is what the pre-fix client
  // wrote, and a real GoTrue refresh token is never equal to the access token.
  return Boolean(
    session.refresh_token && session.refresh_token === session.access_token,
  );
}

/** Prefix of an opaque refresh token minted by our own server (see
 *  server/src/services/passkey-token.service.ts). Distinguishes a token this app
 *  can actually exchange at `/auth/passkey/refresh` from the sentinel and from
 *  legacy sessions that have no renewable token at all. */
export const PASSKEY_REFRESH_TOKEN_PREFIX = 'pkrt_';

/**
 * True when the session carries a refresh token our server can rotate. Only then
 * is silent renewal worth attempting; older passkey sessions (sentinel or legacy
 * shape) can only be replaced by a fresh biometric login.
 */
export function hasRenewablePasskeySession(
  session: SessionLike | null | undefined,
): boolean {
  return (
    isPasskeySession(session) &&
    typeof session?.refresh_token === 'string' &&
    session.refresh_token.startsWith(PASSKEY_REFRESH_TOKEN_PREFIX)
  );
}
