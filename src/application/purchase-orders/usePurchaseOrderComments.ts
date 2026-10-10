import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getPurchaseOrderComments,
  addPurchaseOrderComment,
} from '@/api/purchase-orders.api';
import { useAuth } from '@/shared/hooks/useAuth';

const QUERY_KEY = ['purchase-orders'] as const;

export function usePOComments(poId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'comments', poId],
    queryFn: () => {
      if (!poId) throw new Error('Mã đơn hàng không hợp lệ');
      return getPurchaseOrderComments(poId);
    },
    enabled: !!poId,
  });
}

export function useAddPOComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (payload: {
      poId: string;
      content: string;
      visibility: 'internal' | 'external';
    }) => addPurchaseOrderComment({ ...payload, userId: user!.id }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'comments', variables.poId],
      });
    },
  });
}
