import { supabase } from '@/services/supabase/client';

/**
 * Client side of the passkey refresh flow.
 *
 * The server owns the refresh token (see server/src/services/passkey-token.service.ts).
 * This module exchanges it at `/auth/passkey/refresh` and installs the resulting
 * session into supabase-js.
 */

/** Metadata the server needs alongside the refresh token. The token itself lives
 *  inside the supabase session, so only these two travel separately. */
const META_KEY = 'vinhphat_passkey_meta';

interface PasskeyMeta {
  credentialId: string;
  familyId: string;
}

function readMeta(): PasskeyMeta | null {
  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PasskeyMeta>;
    if (!parsed.credentialId || !parsed.familyId) return null;
    return { credentialId: parsed.credentialId, familyId: parsed.familyId };
  } catch {
    return null;
  }
}

export function storePasskeyMeta(meta: PasskeyMeta): void {
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // Storage can be unavailable (private mode quota); renewal then simply is not
    // available and the session falls back to a fresh biometric login.
  }
}

export function clearPasskeyMeta(): void {
  try {
    window.localStorage.removeItem(META_KEY);
  } catch {
    /* ignore */
  }
}

export interface RefreshedSession {
  refreshToken: string;
  /** Epoch seconds, mirroring the shape supabase-js stores. */
  expiresAt?: number;
}

/**
 * Exchange the stored refresh token for a new access + refresh pair and install
 * it into supabase-js. Returns `null` when renewal is not possible (no token,
 * reuse detected, expired, or the server rejected it) — callers must then fall
 * back to signing out and asking for a fresh login.
 */
export async function refreshPasskeySession(
  refreshToken: string,
): Promise<RefreshedSession | null> {
  const meta = readMeta();
  if (!meta) return null;

  let res: Response;
  try {
    res = await fetch('/api/v1/auth/passkey/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token: refreshToken,
        credential_id: meta.credentialId,
      }),
    });
  } catch {
    // Offline: keep the session, the caller retries later. Do not destroy it.
    return null;
  }

  if (!res.ok) {
    // A definitive rejection (reuse/expired/invalid) means these tokens are dead
    // — drop the metadata so we stop trying with a known-bad credential.
    if (res.status === 401) clearPasskeyMeta();
    return null;
  }

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!data.access_token || !data.refresh_token) return null;

  const { error } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  if (error) return null;

  // The family id is stable across rotation; keep it alongside the new token.
  storePasskeyMeta({
    credentialId: meta.credentialId,
    familyId: meta.familyId,
  });

  return {
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in
      ? Math.floor(Date.now() / 1000) + data.expires_in
      : undefined,
  };
}

/**
 * Revoke the whole refresh family on sign-out, so a stolen refresh token cannot
 * outlive the session. Best-effort: a failure must never block sign-out.
 */
export async function revokePasskeySession(): Promise<void> {
  const meta = readMeta();
  clearPasskeyMeta();
  if (!meta) return;

  try {
    await fetch('/api/v1/auth/passkey/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ family_id: meta.familyId }),
    });
  } catch {
    // Offline or server down: the token still expires on its own TTL.
  }
}
