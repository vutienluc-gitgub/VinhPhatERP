import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ProtectedRoute } from '@/app/router/ProtectedRoute';
import type { AuthContextValue } from '@/features/auth/AuthProvider';

// Default mock values
const mockAuth: AuthContextValue = {
  user: null,
  session: null,
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  isAdmin: false,
  isManager: false,
  isStaff: false,
};

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => mockAuth,
}));

describe('ProtectedRoute', () => {
  it('redirects to login when user is not authenticated', () => {
    mockAuth.user = null;

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Page')).toBeDefined();
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('renders content when user is authenticated', () => {
    // Correctly cast without using 'any' directly where forbidden
    const mockUser = {
      id: '123',
      email: 'test@example.com',
    };
    mockAuth.user = mockUser as unknown as AuthContextValue['user'];

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Protected Content')).toBeDefined();
  });
});
