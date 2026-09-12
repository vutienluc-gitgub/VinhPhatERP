import { useMemo, type ReactNode } from 'react';

import type { SupplierCapabilityCode } from '@/domain/crm/suppliers.types';
import { SupplierEntitlementContext } from '@/features/supplier-portal/context/SupplierEntitlementContextInstance';
import type { PortalEntitlement } from '@/features/supplier-portal/types/entitlements';
import { resolveSupplierEntitlements } from '@/features/supplier-portal/utils/entitlementResolver';

interface SupplierEntitlementProviderProps {
  capabilities?: SupplierCapabilityCode[];
  categoryFallback?: string;
  isLoading?: boolean;
  children: ReactNode;
}

export function SupplierEntitlementProvider({
  capabilities = [],
  categoryFallback,
  isLoading = false,
  children,
}: SupplierEntitlementProviderProps) {
  const entitlements = useMemo(
    () => resolveSupplierEntitlements(capabilities, categoryFallback),
    [capabilities, categoryFallback],
  );

  const value = useMemo(
    () => ({
      capabilities,
      entitlements,
      hasEntitlement: (e: PortalEntitlement) => entitlements.has(e),
      isLoading,
    }),
    [capabilities, entitlements, isLoading],
  );

  return (
    <SupplierEntitlementContext.Provider value={value}>
      {children}
    </SupplierEntitlementContext.Provider>
  );
}
