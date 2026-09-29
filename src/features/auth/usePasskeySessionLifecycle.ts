import { useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase/client';
import { isPasskeySession } from '@/shared/lib/session-kind';

/**
 * Passkey sessions carry a refresh token our own server issued, not one GoTrue
 * recognises. Left to itself, supabase-js would periodically POST it to /token,
 * get a 400, and then *delete* the session on that non-retryable error — logging
 * the user out mid-use. {@link PasskeyExpiryNotice} does the renewal instead, so
 * the client's own auto-refresh must stay off for these sessions.
 */
export function useSessionAutoRefresh() {
  return useCallback(async (s: Session | null) => {
    if (isPasskeySession(s)) {
      await supabase.auth.stopAutoRefresh();
    } else {
      await supabase.auth.startAutoRefresh();
    }
  }, []);
}

/**
 * Revoke the passkey refresh family before signing out. GoTrue cannot invalidate
 * a token it never issued, so without this the refresh token outlives the
 * session. Best-effort: a failure must never block sign-out.
 */
export async function revokePasskeyFamily(): Promise<void> {
  try {
    const { revokePasskeySession } =
      await import('@/features/auth/passkey-session.client');
    await revokePasskeySession();
  } catch {
    // Offline or server down; the token still expires on its own TTL.
  }
}
