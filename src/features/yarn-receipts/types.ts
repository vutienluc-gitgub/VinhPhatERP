export type DocStatus = 'draft' | 'confirmed' | 'cancelled'

export type YarnReceiptItem = {
  id: string
  receipt_id: string
  yarn_type: string
  color_name: string | null
  color_code: string | null
  unit: string
  quantity: number
  unit_price: number
  amount: number
  lot_number: string | null
  tensile_strength: string | null
  composition: string | null
  origin: string | null
  notes: string | null
  sort_order: number
}

export type YarnReceipt = {
  id: string
  receipt_number: string
  supplier_id: string
  receipt_date: string
  total_amount: number
  status: DocStatus
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  /** Joined from suppliers table */
  suppliers?: { name: string; code: string } | null
  yarn_receipt_items?: YarnReceiptItem[]
}

export type YarnReceiptsFilter = {
  search?: string
  status?: DocStatus
  supplierId?: string
  dateFrom?: string
  dateTo?: string
}
