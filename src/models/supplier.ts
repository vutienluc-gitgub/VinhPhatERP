import type { TableRow, TableInsert, TableUpdate, SupplierCategory } from './common'

export type Supplier = TableRow<'suppliers'>
export type SupplierInsert = TableInsert<'suppliers'>
export type SupplierUpdate = TableUpdate<'suppliers'>

export type SupplierFilter = {
  category?: SupplierCategory
  status?: 'active' | 'inactive'
  search?: string
}
