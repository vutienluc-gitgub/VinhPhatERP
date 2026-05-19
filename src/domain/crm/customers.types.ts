/**
 * Customer domain types.
 * Pure TypeScript — no React or Supabase dependency.
 */
export * from '@/schema/customer.schema';

import type {
  TableRow,
  TableInsert,
  TableUpdate,
} from '@/shared/types/database.models';

export type Customer = TableRow<'customers'> & {
  account_balance?: number;
  salesperson?: { id: string; code: string; name: string } | null;
};
export type CustomerInsert = TableInsert<'customers'>;
export type CustomerUpdate = TableUpdate<'customers'>;

export type CustomersFilter = {
  query?: string;
  status?: 'active' | 'inactive';
  salesperson_id?: string;
};

export interface PortalAccount {
  id: string;
  email: string;
  is_active: boolean;
}
