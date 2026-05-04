import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  fetchPurchaseOrders,
  fetchPurchaseOrderById,
  createPurchaseOrder,
  approvePurchaseOrder,
  rejectPurchaseOrder,
  createGoodsReceipt,
  fetchGoodsReceiptsByPo,
} from '@/api/purchase-orders.api';
import type {
  PurchaseOrderFormValues,
  GoodsReceiptFormValues,
  PurchaseOrder,
} from '@/domain/purchase-orders';
import { useAuth } from '@/shared/hooks/useAuth';

const QUERY_KEY = ['purchase-orders'] as const;

export function usePurchaseOrderList(
  filters: { status?: string; supplier_id?: string } = {},
) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'list', filters],
    queryFn: () => fetchPurchaseOrders(filters) as Promise<PurchaseOrder[]>,
  });
}

export function usePurchaseOrder(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'detail', id],
    enabled: !!id,
    queryFn: () => fetchPurchaseOrderById(id!) as Promise<PurchaseOrder>,
  });
}

export function useGoodsReceiptsByPo(poId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'receipts', poId],
    enabled: !!poId,
    queryFn: () => fetchGoodsReceiptsByPo(poId!),
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (values: PurchaseOrderFormValues) =>
      createPurchaseOrder(values, user!.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useApprovePurchaseOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (id: string) => approvePurchaseOrder(id, user!.id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'detail', id],
      });
      void queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'list'] });
    },
  });
}

export function useRejectPurchaseOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectPurchaseOrder(id, reason, user!.id),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'detail', id],
      });
      void queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'list'] });
    },
  });
}

export function useCreateGoodsReceipt() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [clientId, setClientId] = useState(() => crypto.randomUUID());

  return useMutation({
    mutationFn: (values: GoodsReceiptFormValues) =>
      createGoodsReceipt(values, user!.id, clientId),
    onSuccess: (_, values) => {
      setClientId(crypto.randomUUID());
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'detail', values.po_id],
      });
      void queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'list'] });
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'receipts', values.po_id],
      });
    },
  });
}
