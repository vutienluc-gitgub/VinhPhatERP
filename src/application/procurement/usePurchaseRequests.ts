import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchPurchaseRequests,
  fetchPurchaseRequestItems,
  fetchNextPrNo,
  createPurchaseRequest,
  deletePurchaseRequest,
} from '@/api/purchase-requests.api';
import type { PrFilter } from '@/api/purchase-requests.api';
import type { PrHeaderFormValues } from '@/schema/purchase-request.schema';

export type { PrFilter };

const QUERY_KEY = ['purchase-requests'] as const;

export function usePurchaseRequestsList(filters: PrFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: () => fetchPurchaseRequests(filters, page),
  });
}

export function usePurchaseRequestItems(prId: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'items', prId],
    queryFn: () => (prId ? fetchPurchaseRequestItems(prId) : []),
    enabled: !!prId,
  });
}

export function useNextPrNo() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-code'],
    queryFn: fetchNextPrNo,
  });
}

export function useCreatePurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: PrHeaderFormValues) => createPurchaseRequest(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeletePurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePurchaseRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
