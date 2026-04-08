import type { TableRow, TableInsert, TableUpdate, OrderStatus } from './common';

export type Order = TableRow<'orders'> & {
  customers?: { name: string; code: string } | null;
  order_items?: OrderItem[];
};

export type OrderInsert = TableInsert<'orders'>;
export type OrderUpdate = TableUpdate<'orders'>;

export type OrderItem = TableRow<'order_items'>;
export type OrderItemInsert = TableInsert<'order_items'>;
export type OrderItemUpdate = TableUpdate<'order_items'>;

export type OrdersFilter = {
  search?: string;
  status?: OrderStatus;
  customerId?: string;
};
