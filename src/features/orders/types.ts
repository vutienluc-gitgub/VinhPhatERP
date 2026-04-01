export type OrderStatus = 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

export type OrderItem = {
  id: string
  order_id: string
  fabric_type: string
  color_name: string | null
  color_code: string | null
  quantity: number
  unit: string
  unit_price: number
  amount: number
  notes: string | null
  sort_order: number
}

export type Order = {
  id: string
  order_number: string
  customer_id: string
  order_date: string
  delivery_date: string | null
  total_amount: number
  paid_amount: number
  status: OrderStatus
  notes: string | null
  confirmed_by: string | null
  confirmed_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  /** Joined from customers table */
  customers?: { name: string; code: string } | null
  order_items?: OrderItem[]
}

export type OrdersFilter = {
  search?: string
  status?: OrderStatus
  customerId?: string
}
