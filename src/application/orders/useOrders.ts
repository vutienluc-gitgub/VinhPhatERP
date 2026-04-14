import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchOrdersPaginated,
  fetchOrderById,
  fetchNextOrderNumber,
  createOrder,
  updateOrderWithItems,
  confirmOrder,
  cancelOrder,
  completeOrder,
  deleteOrder,
  updateOrderStatus,
  fetchOrderAuditLogs,
} from '@/api/orders.api';
import {
  calculateOrderTotal,
  mapOrderFormToDb,
  mapOrderItemsToDb,
} from '@/domain/orders/OrderDomain';
import type { OrdersFormValues } from '@/features/orders/orders.module';
import type { OrdersFilter } from '@/features/orders/types';

const QUERY_KEY = ['orders'] as const;

/* ── List with filters + pagination ── */

export function useOrderList(filters: OrdersFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page] as const,
    queryFn: () => fetchOrdersPaginated(filters, page),
  });
}

/* ── Single order with items ── */

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    enabled: !!id,
    queryFn: () => fetchOrderById(id!),
  });
}

/* ── Auto-generate order number ── */

export function useNextOrderNumber() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-number'],
    queryFn: fetchNextOrderNumber,
  });
}

/* ── Create order (header + items) ── */

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: OrdersFormValues) => {
      const total = calculateOrderTotal(values.items);
      return createOrder(
        mapOrderFormToDb(values, total),
        mapOrderItemsToDb(values.items),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/* ── Update order ── */

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: OrdersFormValues;
    }) => {
      const total = calculateOrderTotal(values.items);
      await updateOrderWithItems(
        id,
        mapOrderFormToDb(values, total),
        mapOrderItemsToDb(values.items),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

/* ── Confirm order → recalculate total, update status, create progress rows ── */

export function useConfirmOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmOrder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['order-progress'] });
    },
  });
}

/* ── Cancel order ── */

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['reserve-rolls'] });
      void queryClient.invalidateQueries({ queryKey: ['finished-fabric'] });
    },
  });
}

/* ── Complete order ── */

export function useCompleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeOrder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/* ── Delete order ── */

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
/* ── Approve/Reject Order Request ── */

export function useApproveOrderRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => updateOrderStatus(id, 'draft'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useRejectOrderRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => updateOrderStatus(id, 'cancelled'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/* ── Audit Logs ── */
export function useOrderAuditLogs(orderId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'audit-logs', orderId],
    enabled: !!orderId,
    queryFn: () => fetchOrderAuditLogs(orderId!),
  });
}
