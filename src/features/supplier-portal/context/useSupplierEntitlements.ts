import { useContext } from 'react';

import {
  SupplierEntitlementContext,
  type SupplierEntitlementContextValue,
} from '@/features/supplier-portal/context/SupplierEntitlementContextInstance';

export function useSupplierEntitlements(): SupplierEntitlementContextValue {
  const context = useContext(SupplierEntitlementContext);
  if (!context) {
    throw new Error(
      'useSupplierEntitlements must be used within a SupplierEntitlementProvider',
    );
  }
  return context;
}
