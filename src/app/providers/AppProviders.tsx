import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from '@/features/auth/AuthProvider';
import { ConfirmProvider } from '@/shared/components/ConfirmDialog';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { TenantProvider } from '@/shared/context/TenantContext';
import { GlobalModalProvider } from '@/shared/hooks/useGlobalModal';
import { GlobalModalDispatcher } from '@/app/components/GlobalModalDispatcher';

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
  );

  return (
    <ErrorBoundary>
      <TenantProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ConfirmProvider>
              <GlobalModalProvider>
                {children}
                <GlobalModalDispatcher />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    className: 'premium-toast',
                    style: {
                      background: 'var(--surface)',
                      backdropFilter: 'blur(12px)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: '16px',
                      padding: '14px 20px',
                      boxShadow: '0 12px 40px rgba(16, 35, 61, 0.15)',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    },
                    success: {
                      iconTheme: {
                        primary: 'var(--success)',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: 'var(--danger)',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </GlobalModalProvider>
            </ConfirmProvider>
          </AuthProvider>
        </QueryClientProvider>
      </TenantProvider>
    </ErrorBoundary>
  );
}
