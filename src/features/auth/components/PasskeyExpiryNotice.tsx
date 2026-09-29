import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

import { isPasskeySession } from '@/shared/lib/session-kind';
import { AUTH_MESSAGES } from '@/features/auth/constants';
import { useAuth } from '@/features/auth/AuthProvider';

/** setTimeout saturates at 2^31-1ms (~24.8 days); clamp so a longer token does
 *  not wrap into an immediate fire. */
const MAX_TIMEOUT_MS = 2_147_483_647;
const TOAST_ID = 'passkey-session-expired';

/**
 * Passkey sessions carry no GoTrue refresh token, so supabase-js cannot renew
 * them. Without this the access token simply dies at `expires_at` and the user
 * is bounced to the login screen with no explanation (or worse, kept on a page
 * whose every API call now 401s). We surface a persistent notice and sign out
 * so the route guard redirects deliberately, instead of dropping the session
 * silently.
 */
export function PasskeyExpiryNotice() {
  const { session, signOut } = useAuth();

  useEffect(() => {
    if (!isPasskeySession(session)) return;

    const expiresAtMs = (session?.expires_at ?? 0) * 1000;
    if (!expiresAtMs) return;

    const notifyAndSignOut = () => {
      toast.error(AUTH_MESSAGES.passkeySessionExpired, {
        id: TOAST_ID,
        duration: Infinity,
      });
      void signOut();
    };

    const remaining = expiresAtMs - Date.now();
    if (remaining <= 0) {
      notifyAndSignOut();
      return;
    }

    const timer = setTimeout(
      notifyAndSignOut,
      Math.min(remaining, MAX_TIMEOUT_MS),
    );
    return () => clearTimeout(timer);
  }, [session, signOut]);

  return null;
}
