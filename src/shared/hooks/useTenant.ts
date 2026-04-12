import { useContext } from 'react';

import { TenantContext } from '@/shared/context/tenant-context';
import type {
  TenantContextValue,
  TenantData,
} from '@/shared/context/tenant-context';

/**
 * Access tenant context from any component.
 * Returns full tenant info (slug, id, plan, status, etc.)
 */
export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant phai dung ben trong <TenantProvider>');
  return ctx;
}

/**
 * Get resolved tenant data (non-null).
 * Throws if tenant not loaded yet — use after loading screen.
 */
export function useTenantData(): TenantData {
  const { data } = useTenant();
  if (!data)
    throw new Error('Tenant data chua san sang. Kiem tra loading state.');
  return data;
}

/**
 * Check if current tenant is on a specific plan or higher.
 */
export function useTenantPlan() {
  const { data } = useTenant();

  const planOrder = {
    trial: 0,
    starter: 1,
    professional: 2,
    enterprise: 3,
  } as const;

  const currentLevel = data ? planOrder[data.plan] : 0;

  return {
    plan: data?.plan ?? 'trial',
    isEnterprise: currentLevel >= 3,
    isProfessional: currentLevel >= 2,
    isStarter: currentLevel >= 1,
    isTrial: data?.plan === 'trial',
    /** Check if current plan meets minimum requirement */
    hasAccess: (minPlan: keyof typeof planOrder) =>
      currentLevel >= planOrder[minPlan],
  };
}
