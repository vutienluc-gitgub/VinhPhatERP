import type { SUPPLIER_CATEGORIES } from './suppliers.module';

export type SupplierCategory = (typeof SUPPLIER_CATEGORIES)[number];

export type Supplier = {
  id: string;
  code: string;
  name: string;
  category: SupplierCategory;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_code: string | null;
  contact_person: string | null;
  notes: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

export type SupplierFilter = {
  category?: SupplierCategory;
  status?: 'active' | 'inactive';
  search?: string;
};
