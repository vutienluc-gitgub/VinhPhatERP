import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { AuthContextValue } from '@/features/auth/AuthProvider'

// Default mock values
let mockAuth: AuthContextValue = {
  session: null,
  user: null,
  profile: null,
  loading: false,
  isBlocked: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => mockAuth,
}))

import { ProtectedRoute } from '@/app/router/ProtectedRoute'

function renderWithRouter(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/auth" element={<p>Login Page</p>} />
        <Route path="/blocked" element={<p>Blocked Page</p>} />
        <Route path="/unauthorized" element={<p>Unauthorized Page</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<p>Dashboard</p>} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<p>Admin Area</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('shows loading state while auth is loading', () => {
    mockAuth = { ...mockAuth, loading: true, session: null }
    renderWithRouter('/dashboard')
    expect(screen.getByText('Đang xác thực…')).toBeInTheDocument()
  })

  it('redirects to /auth when not authenticated', () => {
    mockAuth = { ...mockAuth, loading: false, session: null }
    renderWithRouter('/dashboard')
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('redirects to /blocked when user is blocked', () => {
    mockAuth = {
      ...mockAuth,
      loading: false,
      session: {} as AuthContextValue['session'],
      isBlocked: true,
      profile: { id: '1', role: 'staff', is_active: false } as AuthContextValue['profile'],
    }
    renderWithRouter('/dashboard')
    expect(screen.getByText('Blocked Page')).toBeInTheDocument()
  })

  it('renders outlet when authenticated', () => {
    mockAuth = {
      ...mockAuth,
      loading: false,
      session: {} as AuthContextValue['session'],
      isBlocked: false,
      profile: { id: '1', role: 'staff', is_active: true } as AuthContextValue['profile'],
    }
    renderWithRouter('/dashboard')
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('redirects to /unauthorized when role is not allowed', () => {
    mockAuth = {
      ...mockAuth,
      loading: false,
      session: {} as AuthContextValue['session'],
      isBlocked: false,
      profile: { id: '1', role: 'staff', is_active: true } as AuthContextValue['profile'],
    }
    renderWithRouter('/admin')
    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument()
  })

  it('renders outlet when role matches allowedRoles', () => {
    mockAuth = {
      ...mockAuth,
      loading: false,
      session: {} as AuthContextValue['session'],
      isBlocked: false,
      profile: { id: '1', role: 'admin', is_active: true } as AuthContextValue['profile'],
    }
    renderWithRouter('/admin')
    expect(screen.getByText('Admin Area')).toBeInTheDocument()
  })
})
