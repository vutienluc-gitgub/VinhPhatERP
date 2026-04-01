export type ShipmentStatus = 'preparing' | 'shipped' | 'delivered' | 'partially_returned' | 'returned'

export type ShipmentItem = {
  id: string
  shipment_id: string
  finished_roll_id: string | null
  fabric_type: string
  color_name: string | null
  quantity: number
  unit: string
  notes: string | null
  sort_order: number
}

export type Shipment = {
  id: string
  shipment_number: string
  order_id: string
  customer_id: string
  shipment_date: string
  delivery_address: string | null
  carrier: string | null
  tracking_number: string | null
  status: ShipmentStatus
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  /** Joined */
  orders?: { order_number: string } | null
  customers?: { name: string; code: string } | null
  shipment_items?: ShipmentItem[]
}

export type ShipmentsFilter = {
  search?: string
  status?: ShipmentStatus
  orderId?: string
}
