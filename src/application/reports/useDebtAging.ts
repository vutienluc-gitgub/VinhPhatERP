import { useQuery } from '@tanstack/react-query';

import { fetchDebtAging } from '@/api/reports.api';

const REPORTS_KEY = ['reports'] as const;

export function useDebtAging() {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'debt-aging'],
    queryFn: fetchDebtAging,
  });
}
