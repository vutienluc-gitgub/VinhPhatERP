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

export async function fetchPurchaseOrderAuditLogs(poId: string) {
  const { data, error } = await untypedDb
    .from('po_audit_logs')
    .select('*, profiles(full_name)')
    .eq('entity_type', 'purchase_order')
    .eq('entity_id', poId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createPurchaseOrder(
  values: PurchaseOrderFormValues,
  userId: string,
) {
  const subtotal = values.items.reduce(
    (sum, item) => sum + item.ordered_qty * item.unit_price,
    0,
  );
  const vatAmount = subtotal * (values.vat_rate / 100);
  const totalAmount = subtotal + vatAmount + values.shipping_fee;

  const { data: poId, error: rpcError } = await untypedDb.rpc(
    'rpc_create_purchase_order',
    {
      p_supplier_id: values.supplier_id,
      p_supplier_name_snapshot: values.supplier_name_snapshot,
      p_order_date: values.order_date,
      p_expected_date: values.expected_date || null,
      p_total_amount: totalAmount,
      p_items: values.items,
      p_created_by: userId,
      p_person_in_charge: values.person_in_charge || null,
      p_payment_terms: values.payment_terms || null,
      p_currency: values.currency || 'VND',
      p_vat_rate: values.vat_rate || 0,
      p_shipping_fee: values.shipping_fee || 0,
      p_delivery_warehouse: values.delivery_warehouse || null,
      p_subtotal_amount: subtotal,
      p_vat_amount: vatAmount,
      p_supplier_ref: values.supplier_ref || null,
      p_incoterms: values.incoterms || null,
      p_payment_deadline: values.payment_deadline || null,
      p_priority: values.priority || 'normal',
      p_attachments: values.attachments || [],
      p_vat_terms: values.vat_terms || null,
    },
  );

  if (rpcError) throw rpcError;

  const { data: po, error: poError } = await untypedDb
    .from('purchase_orders')
    .select()
    .eq('id', poId)
    .single();

  if (poError) throw poError;

  return po;
}

export async function fetchApprovalPolicies() {
  const { data, error } = await untypedDb.from('approval_policies').select('*');
  if (error) throw error;
  return data;
}

export async function submitPurchaseOrder(poId: string, userId: string) {
  const { data, error } = await untypedDb
    .from('purchase_orders')
    .update({ status: 'pending_approval' })
    .eq('id', poId)
    .select()
    .single();

  if (error) throw error;

  await untypedDb.from('po_audit_logs').insert({
    entity_type: 'purchase_order',
    entity_id: poId,
    action: 'submitted',
    actor_id: userId,
    snapshot: data,
  });

  return data;
}

export async function approvePurchaseOrder(
  poId: string,
  userId: string,
  comment?: string,
  sendImmediately?: boolean,
) {
  const targetStatus = sendImmediately ? 'sent' : 'approved';

  const { data, error } = await untypedDb
    .from('purchase_orders')
    .update({
      status: targetStatus,
      approved_by: userId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', poId)
    .select()
    .single();

  if (error) throw error;

  // Insert PO audit log for approval
  await untypedDb.from('po_audit_logs').insert({
    entity_type: 'purchase_order',
    entity_id: poId,
    action: 'approved',
    actor_id: userId,
    snapshot: data,
    comment,
  });

  // If send immediately is enabled, insert another audit log for sending
  if (sendImmediately) {
    await untypedDb.from('po_audit_logs').insert({
      entity_type: 'purchase_order',
      entity_id: poId,
      action: 'sent',
      actor_id: userId,
      snapshot: data,
      comment: 'Tự động gửi khi duyệt (Approved & Sent)',
    });
  }

  return data;
}

export async function sendPurchaseOrder(poId: string, userId: string) {
  const { data, error } = await untypedDb
    .from('purchase_orders')
    .update({
      status: 'sent',
    })
    .eq('id', poId)
    .select()
    .single();

  if (error) throw error;

  await untypedDb.from('po_audit_logs').insert({
    entity_type: 'purchase_order',
    entity_id: poId,
    action: 'sent',
    actor_id: userId,
    snapshot: data,
    comment: 'Đã gửi nhà cung cấp (Sent to Supplier)',
  });

  return data;
}

export async function confirmPurchaseOrder(poId: string, userId: string) {
  const { data, error } = await untypedDb
    .from('purchase_orders')
    .update({
      status: 'supplier_confirmed',
    })
    .eq('id', poId)
    .select()
    .single();

  if (error) throw error;

  await untypedDb.from('po_audit_logs').insert({
    entity_type: 'purchase_order',
    entity_id: poId,
    action: 'supplier_confirmed',
    actor_id: userId,
    snapshot: data,
    comment: 'Nhà cung cấp xác nhận đơn (Supplier Confirmed)',
  });

  return data;
}

export async function requestChangesPurchaseOrder(
  poId: string,
  reason: string,
  userId: string,
) {
  const { data, error } = await untypedDb
    .from('purchase_orders')
    .update({
      status: 'request_changes',
      rejection_reason: reason,
    })
    .eq('id', poId)
    .select()
    .single();

  if (error) throw error;

  await untypedDb.from('po_audit_logs').insert({
    entity_type: 'purchase_order',
    entity_id: poId,
    action: 'request_changes',
    actor_id: userId,
    snapshot: data,
    comment: reason,
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
    comment: reason,
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
