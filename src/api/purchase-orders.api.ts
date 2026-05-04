import { untypedDb } from '@/services/supabase/client';
import type {
  PurchaseOrderFormValues,
  GoodsReceiptFormValues,
} from '@/domain/purchase-orders';

export async function fetchPurchaseOrders(filters: {
  status?: string;
  supplier_id?: string;
}) {
  let query = untypedDb
    .from('v_po_detail_full')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.supplier_id) {
    query = query.eq('supplier_id', filters.supplier_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchPurchaseOrderById(id: string) {
  const { data: po, error: poError } = await untypedDb
    .from('purchase_orders')
    .select('*, suppliers(name)')
    .eq('id', id)
    .single();

  if (poError) throw poError;

  const { data: items, error: itemsError } = await untypedDb
    .from('v_po_item_status')
    .select('*')
    .eq('po_id', id);

  if (itemsError) throw itemsError;

  return { ...po, items };
}

export async function createPurchaseOrder(
  values: PurchaseOrderFormValues,
  userId: string,
) {
  const { data: poCode, error: codeError } =
    await untypedDb.rpc('next_po_code');
  if (codeError) throw codeError;

  const { data: po, error: poError } = await untypedDb
    .from('purchase_orders')
    .insert({
      po_code: poCode,
      supplier_id: values.supplier_id,
      supplier_name_snapshot: values.supplier_name_snapshot,
      order_date: values.order_date,
      expected_date: values.expected_date || null,
      created_by: userId,
      status: 'draft',
      total_amount: values.items.reduce(
        (sum, item) => sum + item.ordered_qty * item.unit_price,
        0,
      ),
    })
    .select()
    .single();

  if (poError) throw poError;

  const itemsToInsert = values.items.map((item) => ({
    po_id: po.id,
    material_id: item.material_id,
    uom: item.uom,
    ordered_qty: item.ordered_qty,
    unit_price: item.unit_price,
  }));

  const { error: itemsError } = await untypedDb
    .from('purchase_order_items')
    .insert(itemsToInsert);

  if (itemsError) throw itemsError;

  await untypedDb.from('po_audit_logs').insert({
    entity_type: 'purchase_order',
    entity_id: po.id,
    action: 'created',
    actor_id: userId,
    snapshot: po,
  });

  return po;
}

export async function approvePurchaseOrder(poId: string, userId: string) {
  const { data, error } = await untypedDb
    .from('purchase_orders')
    .update({
      status: 'approved',
      approved_by: userId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', poId)
    .select()
    .single();

  if (error) throw error;

  await untypedDb.from('po_audit_logs').insert({
    entity_type: 'purchase_order',
    entity_id: poId,
    action: 'approved',
    actor_id: userId,
    snapshot: data,
  });

  return data;
}

export async function rejectPurchaseOrder(
  poId: string,
  reason: string,
  userId: string,
) {
  const { data, error } = await untypedDb
    .from('purchase_orders')
    .update({
      status: 'rejected',
      rejection_reason: reason,
    })
    .eq('id', poId)
    .select()
    .single();

  if (error) throw error;

  await untypedDb.from('po_audit_logs').insert({
    entity_type: 'purchase_order',
    entity_id: poId,
    action: 'rejected',
    actor_id: userId,
    snapshot: data,
  });

  return data;
}

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
