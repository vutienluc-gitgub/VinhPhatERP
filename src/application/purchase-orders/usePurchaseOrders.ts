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
  fetchApprovalPolicies,
  submitPurchaseOrder,
  requestChangesPurchaseOrder,
  fetchPurchaseOrderAuditLogs,
  sendPurchaseOrder,
  confirmPurchaseOrder,
  getPurchaseOrderComments,
  addPurchaseOrderComment,
  fetchGoodsReceiptById,
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

export function usePurchaseOrderAuditLogs(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'audit-logs', id],
    enabled: !!id,
    queryFn: () => fetchPurchaseOrderAuditLogs(id!),
  });
}

export function useGoodsReceiptsByPo(poId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'receipts', poId],
    enabled: !!poId,
    queryFn: () => fetchGoodsReceiptsByPo(poId!),
  });
}

export function useGoodsReceipt(grId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'receipt', grId],
    enabled: !!grId,
    queryFn: () => fetchGoodsReceiptById(grId!),
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

export function useApprovalPolicies() {
  return useQuery({
    queryKey: ['approval-policies'],
    queryFn: fetchApprovalPolicies,
  });
}

export function useSubmitPurchaseOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (id: string) => submitPurchaseOrder(id, user!.id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'detail', id],
      });
      void queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'list'] });
    },
  });
}

export function useApprovePurchaseOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({
      id,
      comment,
      sendImmediately,
    }: {
      id: string;
      comment?: string;
      sendImmediately?: boolean;
    }) => approvePurchaseOrder(id, user!.id, comment, sendImmediately),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'detail', id],
      });
      void queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'list'] });
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'audit-logs', id],
      });
    },
  });
}

export function useSendPurchaseOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (id: string) => sendPurchaseOrder(id, user!.id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'detail', id],
      });
      void queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'list'] });
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'audit-logs', id],
      });
    },
  });
}

export function useConfirmPurchaseOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (id: string) => confirmPurchaseOrder(id, user!.id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'detail', id],
      });
      void queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'list'] });
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'audit-logs', id],
      });
    },
  });
}

export function useRequestChangesPurchaseOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      requestChangesPurchaseOrder(id, reason, user!.id),
    onSuccess: (_, { id }) => {
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
    mutationFn: (payload: { poId: string; content: string }) =>
      addPurchaseOrderComment({ ...payload, userId: user!.id }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'comments', variables.poId],
      });
    },
  });
}
