import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ProtectedRoute } from '@/app/router/ProtectedRoute';
import type { AuthContextValue } from '@/features/auth/AuthProvider';

// Default mock values
const mockAuth: AuthContextValue = {
  user: null,
  session: null,
  profile: null,
  loading: false,
  isBlocked: false,
  signIn: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
};

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => mockAuth,
}));

describe('ProtectedRoute', () => {
  it('redirects to login when user is not authenticated', () => {
    mockAuth.user = null;
    mockAuth.session = null;

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/auth" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Page')).toBeDefined();
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('renders content when user is authenticated', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
    };
    mockAuth.user = mockUser as unknown as AuthContextValue['user'];
    mockAuth.session = {
      user: mockUser,
    } as unknown as AuthContextValue['session'];

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Protected Content')).toBeDefined();
  });
});
