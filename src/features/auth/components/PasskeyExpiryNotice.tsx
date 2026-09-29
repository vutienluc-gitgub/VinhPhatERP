import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

import {
  hasRenewablePasskeySession,
  isPasskeySession,
} from '@/shared/lib/session-kind';
import { AUTH_MESSAGES } from '@/features/auth/constants';
import { useAuth } from '@/features/auth/AuthProvider';
import { refreshPasskeySession } from '@/features/auth/passkey-session.client';

/** setTimeout saturates at 2^31-1ms (~24.8 days); clamp so a longer token does
 *  not wrap into an immediate fire. */
const MAX_TIMEOUT_MS = 2_147_483_647;
const TOAST_ID = 'passkey-session-expired';

/** Renew this long before expiry, so a slow or offline renewal has slack before
 *  the access token actually dies. */
const RENEW_LEAD_MS = 5 * 60 * 1000;

/** Retry cadence while a renewal keeps failing but the access token is still
 *  valid. Once the token expires, a failed renewal signs out instead. */
const RENEW_RETRY_MS = 60 * 1000;

/**
 * Keeps passkey sessions alive. They carry a refresh token minted by our own
 * server (GoTrue holds none), so supabase-js cannot renew them on its own; the
 * token is exchanged here shortly before expiry.
 *
 * Sessions without such a token — the old sentinel, or legacy sessions — cannot
 * be renewed at all, so they keep the previous behaviour: a persistent notice and
 * a deliberate sign-out, rather than a silent expiry that leaves every API call
 * returning 401.
 */
export function PasskeyExpiryNotice() {
  const { session, signOut } = useAuth();
  const retryRef = useRef(0);
  const seenExpiryRef = useRef<number | null>(null);
  // Bumped to re-run the effect for a scheduled retry without changing session.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isPasskeySession(session)) return;

    const expiresAtMs = (session?.expires_at ?? 0) * 1000;
    if (!expiresAtMs) return;

    // A new (rotated) session resets the retry ladder.
    if (seenExpiryRef.current !== expiresAtMs) {
      seenExpiryRef.current = expiresAtMs;
      retryRef.current = 0;
    }

    const notifyAndSignOut = () => {
      toast.error(AUTH_MESSAGES.passkeySessionExpired, {
        id: TOAST_ID,
        duration: Infinity,
      });
      void signOut();
    };

    const renewable = hasRenewablePasskeySession(session);
    const remaining = expiresAtMs - Date.now();

    if (!renewable) {
      if (remaining <= 0) {
        notifyAndSignOut();
        return;
      }
      const timer = setTimeout(
        notifyAndSignOut,
        Math.min(remaining, MAX_TIMEOUT_MS),
      );
      return () => clearTimeout(timer);
    }

    const renew = async () => {
      const refreshed = await refreshPasskeySession(session!.refresh_token!);
      if (refreshed) {
        // setSession inside the refresh updates auth state; the effect re-runs
        // with the new expiry and schedules the next renewal.
        return;
      }
      if (Date.now() < expiresAtMs) {
        // Still valid: an offline blip or a server hiccup. Try again later.
        retryRef.current += 1;
        setAttempt((n) => n + 1);
        return;
      }
      // Expired and unrenewable — sign out deliberately, with an explanation.
      notifyAndSignOut();
    };

    const delay =
      Math.max(0, remaining - RENEW_LEAD_MS) +
      (retryRef.current > 0 ? RENEW_RETRY_MS : 0);

    const timer = setTimeout(
      () => {
        void renew();
      },
      Math.min(delay, MAX_TIMEOUT_MS),
    );
    return () => clearTimeout(timer);
  }, [session, signOut, attempt]);

  return null;
}
