import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';

const { getSession, onAuthStateChange, from } = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
  from: vi.fn(() => ({
    select: () => ({ eq: () => ({ single: vi.fn() }) }),
  })),
}));

vi.mock('@/services/supabase/client', () => ({
  supabase: {
    auth: {
      getSession,
      onAuthStateChange,
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

function LoadingProbe() {
  const { loading, user } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? 'yes' : 'no'}</span>
    </div>
  );
}

describe('AuthProvider — initial session loading', () => {
  beforeEach(() => {
    getSession.mockReset();
    onAuthStateChange.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clears loading when there is no session', async () => {
    getSession.mockResolvedValue({ data: { session: null } });

    render(
      <AuthProvider>
        <LoadingProbe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false'),
    );
  });

  // Regression: getSession().then() had no .catch, so a rejection left loading
  // true forever and every protected route hung on AuthLoadingScreen.
  it('clears loading when getSession rejects instead of hanging', async () => {
    getSession.mockRejectedValue(new Error('storage unavailable'));

    render(
      <AuthProvider>
        <LoadingProbe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false'),
    );
    expect(screen.getByTestId('user').textContent).toBe('no');
  });
});
