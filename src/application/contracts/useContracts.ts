import { useQuery } from '@tanstack/react-query';

import { getContracts } from '@/features/contracts/contracts.service';
import type { ContractsFilter } from '@/features/contracts/contracts.module';

const QUERY_KEY = ['contracts'] as const;

export function useContractsList(filters: ContractsFilter = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: () => getContracts(filters),
  });
}
