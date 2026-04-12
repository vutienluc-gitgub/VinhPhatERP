import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { updateOrderStatus, fetchOrders } from '@/api/orders.api';
import type { Database } from '@/services/supabase/database.types';
import type {
  OrderKanbanItem,
  OrderKanbanStatus,
} from '@/features/order-kanban/types';

type DbOrderStatus = Database['public']['Enums']['order_status'];

const KANBAN_TO_DB: Record<OrderKanbanStatus, DbOrderStatus> = {
  draft: 'draft',
  confirmed: 'confirmed',
  delivering: 'in_progress',
  completed: 'completed',
};

function mapDbStatusToKanban(status: string): OrderKanbanStatus {
  const map: Record<string, OrderKanbanStatus> = {
    draft: 'draft',
    confirmed: 'confirmed',
    in_progress: 'delivering',
    completed: 'completed',
    cancelled: 'completed',
  };
  return map[status] ?? 'draft';
}

export function useOrderKanban() {
  return useQuery<OrderKanbanItem[]>({
    queryKey: ['order-kanban'],
    queryFn: async () => {
      const orders = await fetchOrders();
      return orders.map((o) => ({
        id: o.id,
        order_number: o.order_number,
        customer_name:
          (o as unknown as { customers?: { name: string } }).customers?.name ??
          '—',
        total_amount: parseFloat(String(o.total_amount ?? '0')),
        delivery_date: o.delivery_date ?? '',
        status: mapDbStatusToKanban(o.status),
        warning: undefined,
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
      await updateOrderStatus(id, KANBAN_TO_DB[status] ?? 'draft');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['order-kanban'] });
    },
  });
}
