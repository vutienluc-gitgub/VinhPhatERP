import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useAuthCallback } from '@/features/auth/useAuthCallback';
import { supabase } from '@/services/supabase/client';
import { AUTH_CALLBACK } from '@/features/auth/auth-callback.constants';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/services/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

describe('useAuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        search: '',
        hash: '',
        origin: 'http://localhost:5173',
      },
    });

    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
          id: 'sub-1',
          callback: vi.fn(),
        },
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('immediately navigates home if an existing session is detected', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-1' },
        } as unknown as import('@supabase/supabase-js').Session,
      },
      error: null,
    });

    const { result } = renderHook(() => useAuthCallback());

    await waitFor(() => {
      expect(result.current.status).toBe('success');
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('captures OAuth error from searchParams and sets error status', async () => {
    window.location.search = '?error_description=Access+denied+by+user';
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuthCallback());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
      expect(result.current.errorMessage).toBe('Access denied by user');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('exchanges PKCE code and navigates home upon success', async () => {
    window.location.search = '?code=pkce-auth-code';
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });
    vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
      data: {
        session: { user: { id: 'pkce-user' } } as unknown as Session,
        user: { id: 'pkce-user' } as unknown as User,
      },
      error: null,
    });

    const { result } = renderHook(() => useAuthCallback());

    await waitFor(() => {
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(
        'pkce-auth-code',
      );
      expect(result.current.status).toBe('success');
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('handles auth state change events like SIGNED_IN', async () => {
    let authCallbackFn:
      | ((event: AuthChangeEvent, session: Session | null) => void)
      | undefined;
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((cb) => {
      authCallbackFn = cb;
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
            id: 'sub-2',
            callback: vi.fn(),
          },
        },
      };
    });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuthCallback());

    await waitFor(() => {
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    act(() => {
      authCallbackFn?.('SIGNED_IN', {
        user: { id: 'signed-in-user' } as unknown as User,
      } as unknown as Session);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('handles timeout when credentials are never received', async () => {
    vi.useFakeTimers();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuthCallback());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTH_CALLBACK.TIMEOUT_MS + 100);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe(AUTH_CALLBACK.TIMEOUT_ERROR);
    vi.useRealTimers();
  });
});
