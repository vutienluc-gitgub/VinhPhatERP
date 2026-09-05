import type { OrderStatus } from '@/schema/order.schema';

/**
 * Order-Kanban domain types.
 * Pure TypeScript — no React or Supabase dependency.
 */
export type OrderKanbanStatus = OrderStatus;

export interface OrderKanbanItem {
  id: string;
  order_number: string;
  customer_name: string;
  customer_code?: string;
  total_amount: number;
  delivery_date: string;
  status: OrderKanbanStatus;
  notes?: string;
  warning?: string;
  created_at?: string;
}
