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
import { DomainEventBus } from '@/domain/core/DomainEventBus';
import type { OrdersFormValues } from '@/features/orders/orders.module';
import type { OrdersFilter } from '@/domain/orders/types';

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
      expectedUpdatedAt,
    }: {
      id: string;
      values: OrdersFormValues;
      expectedUpdatedAt?: string;
    }) => {
      const total = calculateOrderTotal(values.items);
      await updateOrderWithItems(
        id,
        mapOrderFormToDb(values, total),
        mapOrderItemsToDb(values.items),
        expectedUpdatedAt,
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
    onSuccess: (_, orderId) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['order-progress'] });
      DomainEventBus.publish({
        eventName: 'OrderConfirmedEvent',
        timestamp: new Date().toISOString(),
        producer: 'useConfirmOrder',
        payload: {
          orderId,
          orderNumber: orderId,
          customerId: '',
          confirmedAt: new Date().toISOString(),
        },
      });
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
    mutationFn: (
      params: { orderId: string; expectedUpdatedAt?: string } | string,
    ) => {
      const orderId = typeof params === 'string' ? params : params.orderId;
      const expectedUpdatedAt =
        typeof params === 'string' ? undefined : params.expectedUpdatedAt;
      return completeOrder(orderId, expectedUpdatedAt);
    },
    onSuccess: (_, params) => {
      const orderId = typeof params === 'string' ? params : params.orderId;
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      DomainEventBus.publish({
        eventName: 'OrderCompletedEvent',
        timestamp: new Date().toISOString(),
        producer: 'useCompleteOrder',
        payload: {
          orderId,
          completedAt: new Date().toISOString(),
        },
      });
    },
  });
}

/* ── Delete order ── */

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: { id: string; expectedUpdatedAt?: string } | string,
    ) => {
      const id = typeof params === 'string' ? params : params.id;
      const expectedUpdatedAt =
        typeof params === 'string' ? undefined : params.expectedUpdatedAt;
      return deleteOrder(id, expectedUpdatedAt);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
/* ── Approve/Reject Order Request ── */

export function useApproveOrderRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: { id: string; expectedUpdatedAt?: string } | string,
    ) => {
      const id = typeof params === 'string' ? params : params.id;
      const expectedUpdatedAt =
        typeof params === 'string' ? undefined : params.expectedUpdatedAt;
      return updateOrderStatus({
        id,
        status: 'draft',
        expectedCurrentStatus: 'pending_review',
        expectedUpdatedAt,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useRejectOrderRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: { id: string; expectedUpdatedAt?: string } | string,
    ) => {
      const id = typeof params === 'string' ? params : params.id;
      const expectedUpdatedAt =
        typeof params === 'string' ? undefined : params.expectedUpdatedAt;
      return updateOrderStatus({
        id,
        status: 'cancelled',
        expectedCurrentStatus: 'pending_review',
        expectedUpdatedAt,
      });
    },
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
