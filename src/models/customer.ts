import type { TableRow, TableInsert, TableUpdate } from './common'

export type Customer = TableRow<'customers'>
export type CustomerInsert = TableInsert<'customers'>
export type CustomerUpdate = TableUpdate<'customers'>

export type CustomersFilter = {
  query?: string
  status?: 'active' | 'inactive'
}
