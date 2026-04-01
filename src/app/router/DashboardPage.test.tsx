import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/services/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ count: 0, data: [], error: null }),
        in: () => ({
          lt: () => ({ count: 0, data: [], error: null }),
          count: 0,
          data: [],
          error: null,
        }),
        gte: () => ({ data: [], error: null }),
        count: 0,
        data: [],
        error: null,
      }),
    }),
  },
  hasSupabaseEnv: () => true,
}))

import { DashboardPage } from '@/app/router/DashboardPage'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe('DashboardPage', () => {
  it('renders the dashboard heading', () => {
    renderWithProviders(<DashboardPage />)

    expect(
      screen.getByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Tổng quan')).toBeInTheDocument()
  })
})