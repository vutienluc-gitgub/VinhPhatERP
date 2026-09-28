import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { AuthPage } from '@/features/auth/AuthPage';
import { LoginForm } from '@/features/auth/LoginForm';

// Mock AuthProvider
vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    session: null,
    loading: false,
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signInWithPasskey: vi.fn(),
    signOut: vi.fn(),
  }),
}));

// Mock Turnstile
vi.mock('@/shared/components/Turnstile', () => ({
  Turnstile: () => <div data-testid="turnstile-mock" />,
}));

// Mock Supabase client
vi.mock('@/services/supabase/client', () => ({
  hasSupabaseEnv: () => true,
  supabase: {},
  untypedDb: {},
}));

describe('Auth Mobile Layout & Order Reproduction Tests', () => {
  it('reproduces failure: AuthPage should allow vertical scrolling on mobile instead of hard lock overflow-hidden', () => {
    const { container } = render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );

    const rootContainer = container.firstElementChild as HTMLElement;
    // Expected: container should support vertical scrolling on mobile (e.g. overflow-y-auto or not unconditionally overflow-hidden)
    expect(rootContainer.className).toMatch(
      /overflow-y-auto|overflow-x-hidden/,
    );
    expect(rootContainer.className).not.toBe(
      'flex min-h-screen w-full bg-auth-bg text-on-dark-foreground overflow-hidden font-sans',
    );
  });

  it('reproduces failure: LoginForm submit button MUST appear before OR divider and SSO buttons', () => {
    const { container } = render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );

    const submitBtn = screen.getByRole('button', {
      name: /đăng nhập vào hệ thống/i,
    });
    const orDivider = container.querySelector('.uppercase')?.parentElement;
    const googleBtn = screen.getByRole('button', {
      name: /tiếp tục với google/i,
    });

    expect(submitBtn).toBeDefined();
    expect(orDivider).toBeDefined();
    expect(googleBtn).toBeDefined();

    // Verify DOM order: Submit button MUST precede OR divider and Google button
    const positionCompareDivider = submitBtn.compareDocumentPosition(
      orDivider!,
    );
    const positionCompareGoogle = submitBtn.compareDocumentPosition(googleBtn);

    // Node.DOCUMENT_POSITION_FOLLOWING (4) means following node comes after reference node
    expect(
      positionCompareDivider & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      positionCompareGoogle & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('reproduces failure: Forgot password button should prevent text truncation with whitespace-nowrap or shrink-0', () => {
    render(
      <MemoryRouter>
        <LoginForm onForgotPassword={vi.fn()} />
      </MemoryRouter>,
    );

    const forgotBtn = screen.getByRole('button', { name: /quên mật khẩu/i });
    expect(forgotBtn.className).toMatch(/whitespace-nowrap|shrink-0/);
  });
});
