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

  it('allows the forgot-password button to wrap instead of forcing horizontal overflow', () => {
    render(
      <MemoryRouter>
        <LoginForm onForgotPassword={vi.fn()} />
      </MemoryRouter>,
    );

    const forgotBtn = screen.getByRole('button', { name: /quên mật khẩu/i });
    // shrink-0 + whitespace-nowrap forced the button's min-content width onto the
    // card, clipping it on narrow viewports / large accessibility font sizes.
    expect(forgotBtn.className).not.toMatch(/\bwhitespace-nowrap\b/);
    expect(forgotBtn.className).not.toMatch(/\bshrink-0\b/);

    // The remember/forgot row must be allowed to wrap on narrow screens.
    const row = forgotBtn.parentElement as HTMLElement;
    expect(row.className).toMatch(/\bflex-wrap\b/);

    // "Ghi nhớ" label must not rely on truncate for its intrinsic width.
    const remember = screen.getByText(/ghi nhớ/i);
    expect(remember.className).not.toMatch(/\btruncate\b/);
  });

  it('reduces card padding and tablist spacing on narrow viewports', () => {
    const { container } = render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );

    const card = container.querySelector('.rounded-3xl') as HTMLElement;
    expect(card.className).toContain('p-4');
    expect(card.className).toContain('sm:p-10');
    expect(card.className).not.toContain('p-6');

    const tablist = screen.getByRole('tablist');
    expect(tablist.className).toContain('p-0.5');
    expect(tablist.className).toContain('sm:p-1');
  });

  it('hides decorative tab icons at the narrowest breakpoint to protect min-content width', () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );

    const tabs = screen.getAllByRole('tab');
    for (const tab of tabs) {
      const icon = tab.querySelector('svg');
      expect(icon?.getAttribute('class')).toContain('max-[359px]:hidden');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('prevents horizontal overflow: auth tabs must be allowed to shrink below their content width', () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);

    for (const tab of tabs) {
      // min-w-0 lets the flex item shrink below its min-content width;
      // without it the nowrap labels force the card wider than narrow viewports.
      expect(tab.className).toMatch(/\bmin-w-0\b/);
      expect(tab.className).not.toMatch(/\bwhitespace-nowrap\b/);
      // Labels must be allowed to wrap/truncate inside the shrinking tab.
      const label = tab.querySelector('span');
      expect(label?.className).toMatch(/min-w-0|truncate/);
    }
  });
});
