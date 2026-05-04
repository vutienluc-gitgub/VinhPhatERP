/**
 * Supplier domain types.
 * Pure TypeScript — no React or Supabase dependency.
 */
import type {
  TableRow,
  TableInsert,
  TableUpdate,
  SupplierCategory,
} from '@/shared/types/database.models';

export type { SupplierCategory };

export type Supplier = TableRow<'suppliers'> & {
  credit_limit?: number;
  rating?: number;
  payment_terms?: string;
  total_pos?: number;
  total_spend?: number;
  on_time_rate?: number;
  avg_lead_time_days?: number;
  category_name?: string;
};
export type SupplierInsert = Omit<TableInsert<'suppliers'>, 'category'> & {
  category?: string;
  credit_limit?: number;
  rating?: number;
  payment_terms?: string;
};
export type SupplierUpdate = Omit<TableUpdate<'suppliers'>, 'category'> & {
  category?: string;
  credit_limit?: number;
  rating?: number;
  payment_terms?: string;
};

export type SupplierFilter = {
  category?: string;
  status?: 'active' | 'inactive';
  search?: string;
};
