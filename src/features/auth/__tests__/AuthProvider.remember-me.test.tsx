import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import {
  createRememberSessionStorage,
  getRememberMe,
  setRememberMe,
} from '@/features/auth/remember-session';

const { getSession, onAuthStateChange, signInWithPassword, from } = vi.hoisted(
  () => ({
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signInWithPassword: vi.fn(),
    from: vi.fn(() => ({
      select: () => ({ eq: () => ({ single: vi.fn() }) }),
    })),
  }),
);

vi.mock('@/services/supabase/client', () => ({
  supabase: {
    auth: {
      getSession,
      onAuthStateChange,
      signInWithPassword,
      startAutoRefresh: vi.fn().mockResolvedValue(undefined),
      stopAutoRefresh: vi.fn().mockResolvedValue(undefined),
    },
    from,
  },
}));

vi.mock('@/services/supabase/tenant', () => ({
  getTenantId: vi.fn().mockResolvedValue(null),
  resetTenantCache: vi.fn(),
}));

let signInRef: ReturnType<typeof useAuth>['signIn'] | null = null;

function Probe() {
  const { signIn } = useAuth();
  useEffect(() => {
    signInRef = signIn;
  }, [signIn]);
  return <span data-testid="ready">{String(Boolean(signIn))}</span>;
}

const KEY = 'vinhphat_session';

describe('AuthProvider.signIn — rememberMe persistence', () => {
  beforeEach(() => {
    getSession.mockReset();
    getSession.mockResolvedValue({ data: { session: null } });
    signInWithPassword.mockReset();
    signInWithPassword.mockResolvedValue({ error: null });
    window.localStorage.clear();
    window.sessionStorage.clear();
    setRememberMe(true);
    signInRef = null;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('routes the session to localStorage when rememberMe is true', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByTestId('ready');
    await waitFor(() => expect(signInRef).not.toBeNull());

    await signInRef!('user@example.com', 'secret', 'token', true);

    expect(getRememberMe()).toBe(true);
    createRememberSessionStorage().setItem(KEY, 'session');
    expect(window.localStorage.getItem(KEY)).toBe('session');
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it('routes the session to sessionStorage when rememberMe is false', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByTestId('ready');
    await waitFor(() => expect(signInRef).not.toBeNull());

    await signInRef!('user@example.com', 'secret', 'token', false);

    expect(getRememberMe()).toBe(false);
    createRememberSessionStorage().setItem(KEY, 'session');
    expect(window.sessionStorage.getItem(KEY)).toBe('session');
    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret',
      options: { captchaToken: 'token' },
    });
  });
});
