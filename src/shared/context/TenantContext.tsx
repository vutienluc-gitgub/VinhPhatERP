import { useMemo, type ReactNode } from 'react';

import { TenantContext, resolveTenant } from '@/shared/context/tenant-context';

interface TenantProviderProps {
  children: ReactNode;
}

/**
 * Provider component for multi-tenant context.
 * This file now only exports the component to satisfy React Fast Refresh.
 */
export function TenantProvider({ children }: TenantProviderProps) {
  const tenant = useMemo(() => resolveTenant(), []);

  return (
    <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
  );
}
