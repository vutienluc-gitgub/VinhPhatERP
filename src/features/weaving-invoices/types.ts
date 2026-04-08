export type WeavingInvoiceStatus = 'draft' | 'confirmed' | 'paid';

export type WeavingInvoiceRoll = {
  id: string;
  invoice_id: string;
  roll_number: string;
  weight_kg: number;
  length_m: number | null;
  quality_grade: 'A' | 'B' | 'C' | null;
  warehouse_location: string | null;
  lot_number: string | null;
  notes: string | null;
  raw_fabric_roll_id: string | null;
  sort_order: number;
  created_at: string;
};

export type WeavingInvoice = {
  id: string;
  invoice_number: string;
  supplier_id: string;
  invoice_date: string;
  fabric_type: string;
  unit_price_per_kg: number;
  total_weight_kg: number;
  total_amount: number;
  paid_amount: number;
  status: WeavingInvoiceStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  /** Joined */
  suppliers?: { name: string; code: string } | null;
  weaving_invoice_rolls?: WeavingInvoiceRoll[];
};

export type WeavingInvoiceFilter = {
  search?: string;
  status?: WeavingInvoiceStatus;
  supplierId?: string;
};
