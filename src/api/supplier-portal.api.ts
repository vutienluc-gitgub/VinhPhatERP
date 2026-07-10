import { untypedDb } from '@/services/supabase/client';

export interface PublicRfqItem {
  id: string;
  material_name: string;
  material_specs: string | null;
  qty_required: number;
  uom: string;
}

export interface PublicRfqDetails {
  id: string;
  tenant_id: string;
  rfq_code: string;
  title: string;
  deadline_date: string;
  status: string;
  notes: string | null;
  items: PublicRfqItem[];
}

export interface SubmitQuotePayload {
  rfq_id: string;
  supplier_name: string;
  supplier_phone: string;
  notes?: string;
  items: Array<{
    rfq_item_id: string;
    unit_price: number;
    qty_offered: number;
    notes?: string;
  }>;
}

export async function fetchPublicRfqDetails(
  rfqId: string,
): Promise<PublicRfqDetails> {
  const { data, error } = await untypedDb.rpc('rpc_get_public_rfq_details', {
    p_rfq_id: rfqId,
  });

  if (error) {
    throw new Error(error.message || 'Không thể tải thông tin RFQ');
  }

  return data as PublicRfqDetails;
}

export async function submitSupplierQuote(
  payload: SubmitQuotePayload,
): Promise<string> {
  const { data, error } = await untypedDb.rpc('rpc_submit_supplier_quote', {
    p_rfq_id: payload.rfq_id,
    p_supplier_name: payload.supplier_name,
    p_supplier_phone: payload.supplier_phone,
    p_notes: payload.notes || null,
    p_items: payload.items,
  });

  if (error) {
    throw new Error(error.message || 'Không thể gửi báo giá');
  }

  return data as string;
}
