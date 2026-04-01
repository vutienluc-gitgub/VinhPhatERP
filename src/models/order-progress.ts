import type { TableRow, TableInsert, TableUpdate } from './common'

export type OrderProgress = TableRow<'order_progress'>
export type OrderProgressInsert = TableInsert<'order_progress'>
export type OrderProgressUpdate = TableUpdate<'order_progress'>

export type OrderProgressWithOrder = OrderProgress & {
  orders?: {
    order_number: string
    delivery_date: string | null
    customers?: { name: string } | null
  } | null
}
