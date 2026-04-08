import { useContext } from 'react';

import {
  TenantContext,
  type TenantInfo,
} from '@/shared/context/tenant-context';

/**
 * Hook to access current tenant information.
 *
 * Usage:
 *   const { slug, isDefault } = useTenant()
 *   // Use slug to filter data or customize branding
 */
export function useTenant(): TenantInfo {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
