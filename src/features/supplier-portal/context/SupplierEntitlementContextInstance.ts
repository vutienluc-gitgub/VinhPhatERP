import { createContext } from 'react';

import type { SupplierCapabilityCode } from '@/domain/crm/suppliers.types';
import type { PortalEntitlement } from '@/features/supplier-portal/types/entitlements';

export interface SupplierEntitlementContextValue {
  capabilities: SupplierCapabilityCode[];
  entitlements: Set<PortalEntitlement>;
  hasEntitlement: (entitlement: PortalEntitlement) => boolean;
  isLoading: boolean;
}

export const SupplierEntitlementContext = createContext<
  SupplierEntitlementContextValue | undefined
>(undefined);
