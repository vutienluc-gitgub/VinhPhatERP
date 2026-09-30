import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '@/services/supabase/client';
import { AUTH_CALLBACK } from '@/features/auth/auth-callback.constants';

export type CallbackStatus = 'processing' | 'error' | 'success';

export interface UseAuthCallbackResult {
  status: CallbackStatus;
  errorMessage: string | null;
  goToLogin: () => void;
  goToDashboard: () => void;
}

/**
 * Handles OAuth callback logic:
 * 1. Checks URL query and hash for provider errors
 * 2. Checks existing session immediately (detectSessionInUrl may have resolved it)
 * 3. Handles PKCE exchange for `code` param
 * 4. Listens for onAuthStateChange events (SIGNED_IN, INITIAL_SESSION, TOKEN_REFRESHED)
 * 5. Polling fallbacks and timeout protection
 */
export function useAuthCallback(): UseAuthCallbackResult {
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const goToLogin = useCallback(() => {
    navigate('/auth', { replace: true });
  }, [navigate]);

  const goToDashboard = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let poll1Id: ReturnType<typeof setTimeout> | undefined;
    let poll2Id: ReturnType<typeof setTimeout> | undefined;
    let authSubscription: { unsubscribe: () => void } | undefined;

    async function handleCallback() {
      try {
        // 1. Check for error parameters in URL (query params or hash)
        const searchParams = new URLSearchParams(window.location.search);
        let hashParams = new URLSearchParams();
        if (window.location.hash.startsWith('#')) {
          hashParams = new URLSearchParams(window.location.hash.slice(1));
        }

        const oauthError =
          searchParams.get('error_description') ||
          searchParams.get('error') ||
          hashParams.get('error_description') ||
          hashParams.get('error');

        if (oauthError) {
          if (!isMounted) return;
          setErrorMessage(decodeURIComponent(oauthError.replace(/\+/g, ' ')));
          setStatus('error');
          return;
        }

        // 2. Immediate check: does Supabase client already have a session?
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();

        if (existingSession) {
          if (!isMounted) return;
          setStatus('success');
          goToDashboard();
          return;
        }

        // 3. PKCE flow: exchange code if present
        const code = searchParams.get('code');
        if (code) {
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);
          if (!isMounted) return;

          if (error) {
            // Check if code was already exchanged by detectSessionInUrl
            const { data: retrySession } = await supabase.auth.getSession();
            if (retrySession?.session) {
              setStatus('success');
              goToDashboard();
              return;
            }
            setErrorMessage(error.message);
            setStatus('error');
            return;
          }

          if (data?.session) {
            setStatus('success');
            goToDashboard();
            return;
          }
        }

        // 4. Subscribe to auth state changes (SIGNED_IN, INITIAL_SESSION, TOKEN_REFRESHED)
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (!isMounted) return;

          if (
            (event === 'SIGNED_IN' ||
              event === 'INITIAL_SESSION' ||
              event === 'TOKEN_REFRESHED') &&
            session
          ) {
            clearTimeout(timeoutId);
            setStatus('success');
            goToDashboard();
          }
        });

        authSubscription = subscription;

        // 5. Short polling backup: re-check getSession after 500ms and 1500ms
        poll1Id = setTimeout(async () => {
          if (!isMounted) return;
          const { data: s1 } = await supabase.auth.getSession();
          if (s1?.session) {
            clearTimeout(timeoutId);
            setStatus('success');
            goToDashboard();
          }
        }, 500);

        poll2Id = setTimeout(async () => {
          if (!isMounted) return;
          const { data: s2 } = await supabase.auth.getSession();
          if (s2?.session) {
            clearTimeout(timeoutId);
            setStatus('success');
            goToDashboard();
          }
        }, 1500);

        // 6. Timeout guard
        timeoutId = setTimeout(() => {
          clearTimeout(poll1Id);
          clearTimeout(poll2Id);
          if (!isMounted) return;
          authSubscription?.unsubscribe();

          // Final check before failing
          supabase.auth.getSession().then(({ data: finalSession }) => {
            if (!isMounted) return;
            if (finalSession?.session) {
              setStatus('success');
              goToDashboard();
            } else {
              setErrorMessage(AUTH_CALLBACK.TIMEOUT_ERROR);
              setStatus('error');
            }
          });
        }, AUTH_CALLBACK.TIMEOUT_MS);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : String(err);
        setErrorMessage(message);
        setStatus('error');
      }
    }

    void handleCallback();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      clearTimeout(poll1Id);
      clearTimeout(poll2Id);
      authSubscription?.unsubscribe();
    };
  }, [goToDashboard]);

  return { status, errorMessage, goToLogin, goToDashboard };
}
