import { untypedDb } from '@/services/supabase/client';
import type {
  PurchaseOrderFormValues,
  GoodsReceiptFormValues,
  PurchaseOrderComment,
} from '@/domain/purchase-orders';
import { safeUpsert } from '@/lib/db-guard';
import { assertSingleMutation } from '@/lib/db-mutation-guard';

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
export interface SubmitPurchaseOrderParams {
  poId: string;
  userId: string;
  expectedUpdatedAt?: string;
}

export async function submitPurchaseOrder(
  poIdOrParams: string | SubmitPurchaseOrderParams,
  maybeUserId?: string,
  maybeExpectedUpdatedAt?: string,
) {
  const params: SubmitPurchaseOrderParams =
    typeof poIdOrParams === 'string'
      ? {
          poId: poIdOrParams,
          userId: maybeUserId!,
          expectedUpdatedAt: maybeExpectedUpdatedAt,
        }
      : poIdOrParams;

  let query = untypedDb
    .from('purchase_orders')
    .update({ status: 'pending_approval' })
    .eq('id', params.poId)
    .in('status', ['draft', 'request_changes']);

  if (params.expectedUpdatedAt) {
    query = query.eq('updated_at', params.expectedUpdatedAt);
  }

  const { data, error } = await query.select().single();

  const validatedData = assertSingleMutation(data, error, {
    entityName: 'Đơn mua hàng',
    expectedStatus: 'draft / request_changes',
    expectedUpdatedAt: params.expectedUpdatedAt,
    transitionName: 'gửi duyệt',
  });

  await safeUpsert({
    table: 'po_audit_logs',
    data: {
      entity_type: 'purchase_order',
      entity_id: params.poId,
      action: 'submitted',
      actor_id: params.userId,
      snapshot: validatedData,
    },
    conflictKey: 'id',
  });

  return validatedData;
}

export interface ApprovePurchaseOrderParams {
  poId: string;
  userId: string;
  comment?: string;
  sendImmediately?: boolean;
  expectedUpdatedAt?: string;
}

export async function approvePurchaseOrder(
  poIdOrParams: string | ApprovePurchaseOrderParams,
  maybeUserId?: string,
  maybeComment?: string,
  maybeSendImmediately?: boolean,
  maybeExpectedUpdatedAt?: string,
) {
  const params: ApprovePurchaseOrderParams =
    typeof poIdOrParams === 'string'
      ? {
          poId: poIdOrParams,
          userId: maybeUserId!,
          comment: maybeComment,
          sendImmediately: maybeSendImmediately,
          expectedUpdatedAt: maybeExpectedUpdatedAt,
        }
      : poIdOrParams;

  const targetStatus = params.sendImmediately ? 'sent' : 'approved';

  let query = untypedDb
    .from('purchase_orders')
    .update({
      status: targetStatus,
      approved_by: params.userId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', params.poId)
    .eq('status', 'pending_approval');

  if (params.expectedUpdatedAt) {
    query = query.eq('updated_at', params.expectedUpdatedAt);
  }

  const { data, error } = await query.select().single();

  const validatedData = assertSingleMutation(data, error, {
    entityName: 'Đơn mua hàng',
    expectedStatus: 'pending_approval',
    expectedUpdatedAt: params.expectedUpdatedAt,
    transitionName: 'phê duyệt',
  });

  // Insert PO audit log for approval
  await safeUpsert({
    table: 'po_audit_logs',
    data: {
      entity_type: 'purchase_order',
      entity_id: params.poId,
      action: 'approved',
      actor_id: params.userId,
      snapshot: validatedData,
      comment: params.comment,
    },
    conflictKey: 'id',
  });

  // If send immediately is enabled, insert another audit log for sending
  if (params.sendImmediately) {
    await safeUpsert({
      table: 'po_audit_logs',
      data: {
        entity_type: 'purchase_order',
        entity_id: params.poId,
        action: 'sent',
        actor_id: params.userId,
        snapshot: validatedData,
        comment: 'Tự động gửi khi duyệt (Approved & Sent)',
      },
      conflictKey: 'id',
    });
  }

  return validatedData;
}

export interface SendPurchaseOrderParams {
  poId: string;
  userId: string;
  expectedUpdatedAt?: string;
}

export async function sendPurchaseOrder(
  poIdOrParams: string | SendPurchaseOrderParams,
  maybeUserId?: string,
  maybeExpectedUpdatedAt?: string,
) {
  const params: SendPurchaseOrderParams =
    typeof poIdOrParams === 'string'
      ? {
          poId: poIdOrParams,
          userId: maybeUserId!,
          expectedUpdatedAt: maybeExpectedUpdatedAt,
        }
      : poIdOrParams;

  let query = untypedDb
    .from('purchase_orders')
    .update({
      status: 'sent',
    })
    .eq('id', params.poId)
    .eq('status', 'approved');

  if (params.expectedUpdatedAt) {
    query = query.eq('updated_at', params.expectedUpdatedAt);
  }

  const { data, error } = await query.select().single();

  const validatedData = assertSingleMutation(data, error, {
    entityName: 'Đơn mua hàng',
    expectedStatus: 'approved',
    expectedUpdatedAt: params.expectedUpdatedAt,
    transitionName: 'gửi nhà cung cấp',
  });

  await safeUpsert({
    table: 'po_audit_logs',
    data: {
      entity_type: 'purchase_order',
      entity_id: params.poId,
      action: 'sent',
      actor_id: params.userId,
      snapshot: validatedData,
      comment: 'Đã gửi nhà cung cấp (Sent to Supplier)',
    },
    conflictKey: 'id',
  });

  return validatedData;
}

export interface ConfirmPurchaseOrderParams {
  poId: string;
  userId: string;
  expectedUpdatedAt?: string;
}

export async function confirmPurchaseOrder(
  poIdOrParams: string | ConfirmPurchaseOrderParams,
  maybeUserId?: string,
  maybeExpectedUpdatedAt?: string,
) {
  const params: ConfirmPurchaseOrderParams =
    typeof poIdOrParams === 'string'
      ? {
          poId: poIdOrParams,
          userId: maybeUserId!,
          expectedUpdatedAt: maybeExpectedUpdatedAt,
        }
      : poIdOrParams;

  let query = untypedDb
    .from('purchase_orders')
    .update({
      status: 'supplier_confirmed',
      confirmation_method: 'manual',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', params.poId)
    .eq('status', 'sent');

  if (params.expectedUpdatedAt) {
    query = query.eq('updated_at', params.expectedUpdatedAt);
  }

  const { data, error } = await query.select().single();

  const validatedData = assertSingleMutation(data, error, {
    entityName: 'Đơn mua hàng',
    expectedStatus: 'sent',
    expectedUpdatedAt: params.expectedUpdatedAt,
    transitionName: 'xác nhận NCC',
  });

  await safeUpsert({
    table: 'po_audit_logs',
    data: {
      entity_type: 'purchase_order',
      entity_id: params.poId,
      action: 'supplier_confirmed',
      actor_id: params.userId,
      snapshot: validatedData,
      comment: 'Xác nhận thủ công bởi nhân viên ERP (Manual Confirm)',
    },
    conflictKey: 'id',
  });

  return validatedData;
}

export interface RequestChangesPurchaseOrderParams {
  poId: string;
  reason: string;
  userId: string;
  expectedUpdatedAt?: string;
}

export async function requestChangesPurchaseOrder(
  poIdOrParams: string | RequestChangesPurchaseOrderParams,
  maybeReason?: string,
  maybeUserId?: string,
  maybeExpectedUpdatedAt?: string,
) {
  const params: RequestChangesPurchaseOrderParams =
    typeof poIdOrParams === 'string'
      ? {
          poId: poIdOrParams,
          reason: maybeReason!,
          userId: maybeUserId!,
          expectedUpdatedAt: maybeExpectedUpdatedAt,
        }
      : poIdOrParams;

  let query = untypedDb
    .from('purchase_orders')
    .update({
      status: 'request_changes',
      rejection_reason: params.reason,
    })
    .eq('id', params.poId)
    .eq('status', 'pending_approval');

  if (params.expectedUpdatedAt) {
    query = query.eq('updated_at', params.expectedUpdatedAt);
  }

  const { data, error } = await query.select().single();

  const validatedData = assertSingleMutation(data, error, {
    entityName: 'Đơn mua hàng',
    expectedStatus: 'pending_approval',
    expectedUpdatedAt: params.expectedUpdatedAt,
    transitionName: 'yêu cầu chỉnh sửa',
  });

  await safeUpsert({
    table: 'po_audit_logs',
    data: {
      entity_type: 'purchase_order',
      entity_id: params.poId,
      action: 'request_changes',
      actor_id: params.userId,
      snapshot: validatedData,
      comment: params.reason,
    },
    conflictKey: 'id',
  });

  return validatedData;
}

export interface RejectPurchaseOrderParams {
  poId: string;
  reason: string;
  userId: string;
  expectedUpdatedAt?: string;
}

export async function rejectPurchaseOrder(
  poIdOrParams: string | RejectPurchaseOrderParams,
  maybeReason?: string,
  maybeUserId?: string,
  maybeExpectedUpdatedAt?: string,
) {
  const params: RejectPurchaseOrderParams =
    typeof poIdOrParams === 'string'
      ? {
          poId: poIdOrParams,
          reason: maybeReason!,
          userId: maybeUserId!,
          expectedUpdatedAt: maybeExpectedUpdatedAt,
        }
      : poIdOrParams;

  let query = untypedDb
    .from('purchase_orders')
    .update({
      status: 'rejected',
      rejection_reason: params.reason,
    })
    .eq('id', params.poId)
    .eq('status', 'pending_approval');

  if (params.expectedUpdatedAt) {
    query = query.eq('updated_at', params.expectedUpdatedAt);
  }

  const { data, error } = await query.select().single();

  const validatedData = assertSingleMutation(data, error, {
    entityName: 'Đơn mua hàng',
    expectedStatus: 'pending_approval',
    expectedUpdatedAt: params.expectedUpdatedAt,
    transitionName: 'từ chối phê duyệt',
  });

  await safeUpsert({
    table: 'po_audit_logs',
    data: {
      entity_type: 'purchase_order',
      entity_id: params.poId,
      action: 'rejected',
      actor_id: params.userId,
      snapshot: validatedData,
      comment: params.reason,
    },
    conflictKey: 'id',
  });

  return validatedData;
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

export async function fetchGoodsReceiptById(grId: string) {
  const { data, error } = await untypedDb
    .from('goods_receipts')
    .select('*, goods_receipt_items(*)')
    .eq('id', grId)
    .single();

  if (error) throw error;
  return data;
}

export async function getPurchaseOrderComments(poId: string) {
  const { data, error } = await untypedDb
    .from('purchase_order_comments')
    .select('*')
    .eq('purchase_order_id', poId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as PurchaseOrderComment[];
}

export async function addPurchaseOrderComment(payload: {
  poId: string;
  content: string;
  userId: string;
  visibility: 'internal' | 'external';
}) {
  const data = (await safeUpsert({
    table: 'purchase_order_comments',
    data: {
      purchase_order_id: payload.poId,
      content: payload.content,
      sender_type: 'erp',
      sender_id: payload.userId,
      visibility: payload.visibility,
    },
    conflictKey: 'id',
  })) as unknown as PurchaseOrderComment[];

  return data[0] as PurchaseOrderComment;
}
