import { readFileSync } from 'node:fs';
import path from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { AuthPage } from '@/features/auth/AuthPage';

/**
 * Regression: the /auth route sits outside .shell-layout, which owns mobile
 * scrolling for the ERP shell. app-shell.css pins html/body to `100dvh` with
 * `overflow: hidden` on phones, but AuthPage sized itself with Tailwind
 * `min-h-screen` (100vh). On iOS Safari 100vh is taller than 100dvh (URL bar
 * visible), so the page overflowed its non-scrollable container and the last
 * line ("Chưa có tài khoản? Đăng ký ngay") could not be scrolled into view.
 *
 * The fix is CSS-level (`.auth-viewport` sizes against 100dvh), so the guard
 * is partly a stylesheet contract assertion plus a class-usage assertion on
 * every render branch.
 */

const authState: { session: unknown; loading: boolean } = {
  session: null,
  loading: false,
};

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => authState,
}));

vi.mock('@/shared/components/Turnstile', () => ({
  Turnstile: () => <div data-testid="turnstile-mock" />,
}));

vi.mock('@/services/supabase/client', () => ({
  hasSupabaseEnv: () => true,
  supabase: {},
  untypedDb: {},
}));

const authCss = readFileSync(
  path.resolve(process.cwd(), 'src/styles/auth.css'),
  'utf-8',
);

function ruleBlock(selector: string): string {
  const match = authCss.match(
    new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`, 's'),
  );
  return match?.[1] ?? '';
}

describe('auth viewport sizing (iOS Safari 100vh ≠ 100dvh)', () => {
  it('.auth-viewport sizes against 100dvh, with 100vh kept as fallback', () => {
    const block = ruleBlock('.auth-viewport');
    expect(block, '.auth-viewport rule must exist').not.toBe('');
    expect(block).toMatch(/height:\s*100dvh/);
    expect(block).toMatch(/min-height:\s*100dvh/);
    // vh fallback must come before dvh so old browsers keep a usable value.
    expect(block).toMatch(/height:\s*100vh[\s\S]*height:\s*100dvh/);
  });

  it('legacy auth page/loading shells also fall back to dvh', () => {
    for (const selector of [
      '.auth-page',
      '.auth-logged-in',
      '.auth-loading-screen',
    ]) {
      expect(ruleBlock(selector), `${selector} must use dvh`).toMatch(
        /min-height:\s*100dvh/,
      );
    }
  });
});

describe('AuthPage applies the dvh-safe viewport shell', () => {
  beforeEach(() => {
    authState.session = null;
    authState.loading = false;
  });

  it('form branch uses auth-viewport and no longer relies on min-h-screen', () => {
    const { container } = render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toMatch(/\bauth-viewport\b/);
    // min-h-screen == 100vh, the exact value that overflowed on iOS.
    expect(root.className).not.toMatch(/\bmin-h-screen\b/);
  });

  it('loading branch uses auth-viewport', () => {
    authState.loading = true;
    const { container } = render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toMatch(/\bauth-viewport\b/);
    expect(root.className).not.toMatch(/\bmin-h-screen\b/);
  });

  it('logged-in branch uses auth-viewport', () => {
    authState.session = { user: { email: 'user@example.com' } };
    const { container } = render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toMatch(/\bauth-viewport\b/);
    expect(root.className).not.toMatch(/\bmin-h-screen\b/);
  });
});
