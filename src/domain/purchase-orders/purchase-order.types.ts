export type PurchaseOrderStatus =
  | 'draft'
  | 'submitted'
  | 'pending_approval'
  | 'approved'
  | 'request_changes'
  | 'rejected'
  | 'sent'
  | 'supplier_confirmed'
  | 'supplier_rejected'
  | 'receiving'
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

  // New ERP fields
  person_in_charge?: string | null;
  payment_terms?: string | null;
  currency?: string | null;
  vat_rate?: number;
  shipping_fee?: number;
  delivery_warehouse?: string | null;
  subtotal_amount?: number;
  vat_amount?: number;
  supplier_ref?: string | null;
  incoterms?: string | null;
  payment_deadline?: string | null;
  priority?: string | null;
  attachments?: string[] | null;
  vat_terms?: string | null;

  // Supplier Portal Fields
  public_token?: string | null;
  confirmed_at?: string | null;
  confirmation_method?: string | null;
  confirmed_ip?: string | null;
  confirmed_user_agent?: string | null;
  supplier_rejection_reason?: string | null;
  supplier_viewed_at?: string | null;

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
  linked_yarn_receipt_id?: string | null;
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

export interface PurchaseOrderComment {
  id: string;
  purchase_order_id: string;
  content: string;
  sender_type: 'erp' | 'supplier';
  visibility: 'internal' | 'external';
  sender_id?: string | null;
  sender_name?: string | null;
  created_at: string;
}
