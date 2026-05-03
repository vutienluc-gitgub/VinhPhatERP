/**
 * Order-Kanban domain types.
 * Pure TypeScript — no React or Supabase dependency.
 */
export type OrderKanbanStatus =
  | 'draft'
  | 'confirmed'
  | 'delivering'
  | 'completed';

export interface OrderKanbanItem {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  delivery_date: string;
  status: OrderKanbanStatus;
  warning?: string;
}
