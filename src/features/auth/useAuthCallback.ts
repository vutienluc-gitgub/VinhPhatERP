import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '@/services/supabase/client';

import { AUTH_CALLBACK } from './auth-callback.constants';

type CallbackStatus = 'processing' | 'error';

interface UseAuthCallbackResult {
  status: CallbackStatus;
  errorMessage: string | null;
  goToLogin: () => void;
}

/**
 * Handles OAuth callback logic:
 * 1. PKCE flow — exchanges `code` query param for session
 * 2. Implicit flow — waits for `onAuthStateChange` with timeout
 * 3. Fallback — checks existing session
 */
export function useAuthCallback(): UseAuthCallbackResult {
  const navigate = useNavigate();
  const processed = useRef(false);
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const goToLogin = useCallback(() => {
    navigate('/auth', { replace: true });
  }, [navigate]);

  const navigateHome = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let authSubscription: { unsubscribe: () => void } | undefined;

    async function handleCallback() {
      try {
        // 1. PKCE flow: exchange code from URL query params
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setErrorMessage(error.message);
            setStatus('error');
            return;
          }
          navigateHome();
          return;
        }

        // 2. Implicit flow: tokens in URL hash (detectSessionInUrl handles this)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') {
              clearTimeout(timeoutId);
              navigateHome();
            }
          });

          authSubscription = subscription;

          timeoutId = setTimeout(() => {
            authSubscription?.unsubscribe();
            setErrorMessage(AUTH_CALLBACK.TIMEOUT_ERROR);
            setStatus('error');
          }, AUTH_CALLBACK.TIMEOUT_MS);

          return;
        }

        // 3. No code and no hash — check existing session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          navigateHome();
          return;
        }

        // 4. Nothing worked — show error
        setErrorMessage(AUTH_CALLBACK.MISSING_CREDENTIALS_ERROR);
        setStatus('error');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setErrorMessage(message);
        setStatus('error');
      }
    }

    handleCallback();

    return () => {
      clearTimeout(timeoutId);
      authSubscription?.unsubscribe();
    };
  }, [navigateHome]);

  return { status, errorMessage, goToLogin };
}
