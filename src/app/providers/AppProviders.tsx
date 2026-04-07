import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { useState } from 'react'

import { AuthProvider } from '@/features/auth/AuthProvider'
import { ConfirmProvider } from '@/shared/components/ConfirmDialog'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { TenantProvider } from '@/shared/context/TenantContext'

// Trigger plugin registration on app startup
import '@/app/plugins'

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  )

  return (
    <ErrorBoundary>
      <TenantProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </AuthProvider>
        </QueryClientProvider>
      </TenantProvider>
    </ErrorBoundary>
  )
}
