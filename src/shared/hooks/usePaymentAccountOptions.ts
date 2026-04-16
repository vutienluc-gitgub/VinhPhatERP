import { useQuery } from '@tanstack/react-query';

import { fetchPaymentAccounts } from '@/api/payments.api';
import type { PaymentAccount } from '@/features/payments/types';

/** Shared hook — danh sach tai khoan thanh toan (cross-feature) */
export function useActivePaymentAccounts(type?: 'bank' | 'cash') {
  return useQuery<PaymentAccount[]>({
    queryKey: ['payment-accounts', 'active', type ?? 'all'],
    queryFn: async () => {
      const accounts = await fetchPaymentAccounts(false);
      if (!type) return accounts;
      return accounts.filter((a) => a.type === type);
    },
  });
}
