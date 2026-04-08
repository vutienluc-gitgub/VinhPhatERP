import type { TableRow, TableInsert, TableUpdate } from './common';

export type OrderProgress = Omit<TableRow<'order_progress'>, 'order_id'> & {
  order_id: string | null;
  work_order_id: string | null;
};
export type OrderProgressInsert = TableInsert<'order_progress'>;
export type OrderProgressUpdate = TableUpdate<'order_progress'>;

export type OrderProgressWithOrder = OrderProgress & {
  orders?: {
    order_number: string;
    delivery_date: string | null;
    status?: string;
    customers?: { name: string } | null;
  } | null;
  work_orders?: {
    work_order_number: string;
    status: string;
    end_date?: string | null;
    supplier?: { name: string } | null;
    bom_template?: { name: string } | null;
  } | null;
};
