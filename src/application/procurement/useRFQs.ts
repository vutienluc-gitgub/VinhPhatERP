import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchPendingPrItems,
  fetchRFQs,
  fetchRFQById,
  fetchRFQItems,
  fetchNextRfqCode,
  createRFQ,
  updateRfqStatus,
  deleteRFQ,
  fetchRFQQuotes,
  awardRFQQuote,
} from '@/api/rfqs.api';
import type { RfqFilter, PendingPrItem } from '@/api/rfqs.api';
import type { RfqFormValues } from '@/schema/sourcing-rfq.schema';

export type { RfqFilter };

const QUERY_KEY = ['sourcing-rfqs'] as const;
const PR_QUERY_KEY = ['purchase-requests'] as const;

export function usePendingPrItems() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'pending-pr-items'],
    queryFn: fetchPendingPrItems,
  });
}

export function useRFQsList(filters: RfqFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: () => fetchRFQs(filters, page),
  });
}

export function useRFQById(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'detail', id],
    queryFn: () => (id ? fetchRFQById(id) : null),
    enabled: !!id,
  });
}

export function useRFQItems(rfqId: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'items', rfqId],
    queryFn: () => (rfqId ? fetchRFQItems(rfqId) : []),
    enabled: !!rfqId,
  });
}

export function useNextRfqCode() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-code'],
    queryFn: fetchNextRfqCode,
  });
}

export function useCreateRFQ() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      values,
      pendingItems,
    }: {
      values: RfqFormValues;
      pendingItems: PendingPrItem[];
    }) => createRFQ(values, pendingItems),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      // Invalidate PR list because PR status changed to 'sourcing'
      void queryClient.invalidateQueries({ queryKey: PR_QUERY_KEY });
    },
  });
}

export function useUpdateRfqStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateRfqStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteRFQ() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRFQ,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useRFQQuotes(rfqId: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'quotes', rfqId],
    queryFn: () => (rfqId ? fetchRFQQuotes(rfqId) : []),
    enabled: !!rfqId,
  });
}

export function useAwardRFQQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: awardRFQQuote,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
