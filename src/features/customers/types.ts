export * from '@/schema/customer.schema';

import type {
  TableRow,
  TableInsert,
  TableUpdate,
} from '@/shared/types/database.models';

export type Customer = TableRow<'customers'>;
export type CustomerInsert = TableInsert<'customers'>;
export type CustomerUpdate = TableUpdate<'customers'>;

export type CustomersFilter = {
  query?: string;
  status?: 'active' | 'inactive';
};
