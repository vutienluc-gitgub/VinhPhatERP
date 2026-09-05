import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { updateOrderStatus, fetchOrders } from '@/api/orders.api';
import type {
  OrderKanbanItem,
  OrderKanbanStatus,
} from '@/domain/orders/kanban.types';

export function useOrderKanban() {
  return useQuery<OrderKanbanItem[]>({
    queryKey: ['order-kanban'],
    queryFn: async () => {
      const orders = await fetchOrders();
      return orders.map((o) => ({
        id: o.id,
        order_number: o.order_number,
        customer_name: o.customers?.name ?? '—',
        customer_code: o.customers?.code ?? undefined,
        total_amount: parseFloat(String(o.total_amount ?? '0')),
        delivery_date: o.delivery_date ?? '',
        status: (o.status ?? 'draft') as OrderKanbanStatus,
        notes: o.notes ?? undefined,
        created_at: o.created_at ?? undefined,
      }));
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: OrderKanbanStatus;
    }) => {
      await updateOrderStatus({
        id,
        status,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['order-kanban'] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
