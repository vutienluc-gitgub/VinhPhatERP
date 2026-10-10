import { untypedDb } from '@/services/supabase/client';
import type { GoodsReceiptFormValues } from '@/domain/purchase-orders';

export async function createGoodsReceipt(
  values: GoodsReceiptFormValues,
  userId: string,
  clientId: string,
) {
  const { data, error } = await untypedDb.rpc('rpc_create_goods_receipt', {
    p_po_id: values.po_id,
    p_client_request_id: clientId,
    p_items: values.items,
    p_received_date: values.received_date,
    p_created_by: userId,
  });

  if (error) throw error;
  return data;
}

export async function fetchGoodsReceiptsByPo(poId: string) {
  const { data, error } = await untypedDb
    .from('goods_receipts')
    .select('*, goods_receipt_items(*)')
    .eq('po_id', poId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchGoodsReceiptById(grId: string) {
  const { data, error } = await untypedDb
    .from('goods_receipts')
    .select('*, goods_receipt_items(*)')
    .eq('id', grId)
    .single();

  if (error) throw error;
  return data;
}
