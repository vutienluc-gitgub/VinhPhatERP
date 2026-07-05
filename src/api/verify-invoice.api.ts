import { untypedDb } from '@/services/supabase/client';

export type PublicWeavingInvoiceSummary = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  fabric_type: string;
  unit_price_per_kg: number;
  total_weight_kg: number;
  total_amount: number;
  paid_amount: number;
  status: string;
  notes: string | null;
  supplier_name: string;
  supplier_code: string;
  item_count: number;
  items: Array<{
    roll_number: string;
    weight_kg: number;
    length_m: number | null;
    quality_grade: string | null;
    warehouse_location: string | null;
    lot_number: string | null;
    notes: string | null;
  }>;
};

export async function fetchPublicWeavingInvoice(
  lookupCode: string,
): Promise<PublicWeavingInvoiceSummary | null> {
  const { data, error } = await untypedDb.rpc(
    'rpc_get_public_weaving_invoice',
    {
      p_lookup_code: lookupCode.trim().toUpperCase(),
    },
  );

  if (error) {
    console.error('[verify-invoice.api]', error);
    throw error;
  }
  if (!data || (Array.isArray(data) && data.length === 0)) return null;

  return (Array.isArray(data) ? data[0] : data) as PublicWeavingInvoiceSummary;
}
