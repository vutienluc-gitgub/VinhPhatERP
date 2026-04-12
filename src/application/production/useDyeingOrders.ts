import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchDyeingOrdersPaginated,
  fetchDyeingOrderById,
  fetchNextDyeingOrderNumber,
  fetchDyeingSuppliers,
  createDyeingOrder,
  updateDyeingOrder,
  sendDyeingOrder,
  completeDyeingOrder,
  deleteDyeingOrder,
} from '@/api/dyeing-orders.api';
import type { DyeingOrderFormValues } from '@/schema/dyeing-order.schema';
import type { DyeingOrderFilter } from '@/features/dyeing-orders/types';

const QUERY_KEY = ['dyeing-orders'] as const;

export function useDyeingOrderList(filters: DyeingOrderFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'list', filters, page],
    queryFn: () => fetchDyeingOrdersPaginated(filters, page),
  });
}

export function useDyeingOrder(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'detail', id],
    queryFn: () => fetchDyeingOrderById(id!),
    enabled: !!id,
  });
}

export function useNextDyeingOrderNumber() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-number'],
    queryFn: fetchNextDyeingOrderNumber,
  });
}

export function useDyeingSuppliers() {
  return useQuery({
    queryKey: ['suppliers', 'dyeing'],
    queryFn: fetchDyeingSuppliers,
  });
}

export function useCreateDyeingOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: DyeingOrderFormValues) => createDyeingOrder(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateDyeingOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: DyeingOrderFormValues;
    }) => updateDyeingOrder(id, values),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'detail', id],
      });
    },
  });
}

export function useSendDyeingOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sendDyeingOrder(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'detail', id],
      });
    },
  });
}

export function useCompleteDyeingOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      actualReturnDate,
    }: {
      id: string;
      actualReturnDate: string;
    }) => completeDyeingOrder(id, actualReturnDate),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'detail', id],
      });
      void queryClient.invalidateQueries({ queryKey: ['finished-fabric'] });
    },
  });
}

export function useDeleteDyeingOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDyeingOrder(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
