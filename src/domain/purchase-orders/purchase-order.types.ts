export type PurchaseOrderStatus =
  | 'draft'
  | 'approved'
  | 'rejected'
  | 'partial_received'
  | 'completed'
  | 'cancelled';
export type UomType = 'kg' | 'cây' | 'mét' | 'cuộn';

export interface PurchaseOrder {
  id: string;
  po_code: string;
  supplier_id: string;
  supplier_name_snapshot: string;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_date?: string | null;
  total_amount: number;
  rejection_reason?: string | null;
  created_by: string;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  tenant_id: string;

  // From views
  total_ordered_qty?: number;
  total_received_qty?: number;
  progress_percentage?: number;

  // Relations
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  material_id: string;
  uom: UomType;
  ordered_qty: number;
  received_qty: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
  tenant_id: string;

  // From v_po_item_status
  remaining_qty?: number;
}

export interface GoodsReceipt {
  id: string;
  receipt_code: string;
  po_id: string;
  received_date: string;
  client_request_id: string;
  created_by: string;
  created_at: string;
  tenant_id: string;
}

export interface GoodsReceiptItem {
  id: string;
  receipt_id: string;
  po_item_id: string;
  received_qty: number;
  unit_price: number;
  created_at: string;
  tenant_id: string;
}
