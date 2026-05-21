import { useAuth } from '@/shared/hooks/useAuth';

export function useCustomerVisibilityScope() {
  const { profile } = useAuth();

  const isSale = profile?.role === 'sale';
  const forcedSalespersonId = isSale ? profile?.employee_id || null : null;
  const canSelectSalesperson = !isSale;

  return {
    isSale,
    forcedSalespersonId,
    canSelectSalesperson,
  };
}
