import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { LoginForm } from '@/features/auth/LoginForm';

const signIn = vi.fn();

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    signIn,
    signInWithGoogle: vi.fn(),
    signInWithPasskey: vi.fn(),
  }),
}));

vi.mock('@/services/supabase/client', () => ({
  hasSupabaseEnv: () => true,
  supabase: {},
}));

vi.mock('@/shared/components/Turnstile', () => ({
  Turnstile: ({ onVerify }: { onVerify: (token: string) => void }) => (
    <button
      type="button"
      data-testid="turnstile-verify"
      onClick={() => onVerify('test-captcha-token')}
    >
      solve
    </button>
  ),
}));

function fillAndSubmit() {
  fireEvent.focus(document.getElementById('email')!);
  fireEvent.change(document.getElementById('email')!, {
    target: { value: 'user@example.com' },
  });
  fireEvent.change(document.getElementById('password')!, {
    target: { value: 'correct-horse-battery' },
  });
  fireEvent.click(screen.getByTestId('turnstile-verify'));
  fireEvent.click(
    screen.getByRole('button', { name: /đăng nhập vào hệ thống/i }),
  );
}

describe('LoginForm — rememberMe wiring', () => {
  beforeEach(() => {
    signIn.mockReset();
    signIn.mockResolvedValue({ error: null });
    (window as unknown as { turnstile?: { reset: () => void } }).turnstile = {
      reset: vi.fn(),
    };
  });

  it('passes rememberMe=true by default (schema default)', async () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );
    fillAndSubmit();
    await screen.findByRole('button', {
      name: /đang xác thực|đăng nhập vào hệ thống/i,
    });
    expect(signIn).toHaveBeenCalledWith(
      'user@example.com',
      'correct-horse-battery',
      'test-captcha-token',
      true,
    );
  });

  it('passes rememberMe=false when the checkbox is unchecked', async () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );
    fireEvent.click(document.getElementById('rememberMe')!);
    fillAndSubmit();
    await screen.findByRole('button', {
      name: /đang xác thực|đăng nhập vào hệ thống/i,
    });
    expect(signIn).toHaveBeenCalledWith(
      'user@example.com',
      'correct-horse-battery',
      'test-captcha-token',
      false,
    );
  });
});
