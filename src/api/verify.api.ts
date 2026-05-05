import { supabase } from '@/services/supabase/client';

export type PublicShipmentSummary = {
  shipment_number: string;
  shipment_date: string;
  status: string;
  journey_status: string | null;
  customer_name: string | null;
  delivery_address: string | null;
  item_count: number;
  items: Array<{
    fabric_type: string | null;
    color_name: string | null;
    quantity: number | null;
    unit: string | null;
  }>;
  journey_logs: Array<{
    status: string;
    created_at: string;
  }>;
  customer_signature_url: string | null;
  signed_at: string | null;
};

export async function fetchPublicShipmentSummary(
  shipmentNumber: string,
): Promise<PublicShipmentSummary | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)(
    'rpc_get_public_shipment',
    {
      p_number: shipmentNumber,
    },
  );

  if (error) throw error;
  if (!data || (Array.isArray(data) && data.length === 0)) return null;

  return (Array.isArray(data) ? data[0] : data) as PublicShipmentSummary;
}
