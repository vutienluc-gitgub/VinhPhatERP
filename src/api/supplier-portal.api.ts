import { untypedDb } from '@/services/supabase/client';
import type { PurchaseOrderComment } from '@/domain/purchase-orders';

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

export interface PublicPoItem {
  id: string;
  material_name: string;
  uom: string;
  order_qty: number;
  unit_price: number;
  line_total: number;
  notes: string | null;
}

export interface PublicPoDetails {
  id: string;
  tenant_id: string;
  po_code: string;
  order_date: string;
  supplier_name: string;
  total_amount: number;
  status: string;
  notes: string | null;
  confirmed_at: string | null;
  confirmation_method: string | null;
  items: PublicPoItem[];
}

export interface ConfirmPublicPoPayload {
  token: string;
  ip?: string;
  user_agent?: string;
}

export async function fetchPublicPoDetails(
  token: string,
): Promise<PublicPoDetails> {
  const { data, error } = await untypedDb.rpc('rpc_get_public_po_details', {
    p_token: token,
  });

  if (error) {
    throw new Error(error.message || 'Không thể tải thông tin Đơn đặt hàng');
  }

  return data as PublicPoDetails;
}

export async function confirmPublicPo(
  payload: ConfirmPublicPoPayload,
): Promise<{ success: boolean; po_id: string }> {
  const { data, error } = await untypedDb.rpc('rpc_confirm_public_po', {
    p_token: payload.token,
    p_ip: payload.ip,
    p_user_agent: payload.user_agent,
  });

  if (error) {
    throw new Error(error.message || 'Không thể xác nhận đơn đặt hàng');
  }

  return data as { success: boolean; po_id: string };
}

export interface RejectPublicPoPayload {
  token: string;
  reason: string;
  ip?: string;
  user_agent?: string;
}

export async function rejectPublicPo(
  payload: RejectPublicPoPayload,
): Promise<{ success: boolean; po_id: string }> {
  const { data, error } = await untypedDb.rpc('rpc_reject_public_po', {
    p_token: payload.token,
    p_reason: payload.reason,
    p_ip: payload.ip,
    p_user_agent: payload.user_agent,
  });

  if (error) {
    throw new Error(error.message || 'Không thể từ chối đơn đặt hàng');
  }

  return data as { success: boolean; po_id: string };
}

export async function getPublicPoComments(
  token: string,
): Promise<PurchaseOrderComment[]> {
  const { data, error } = await untypedDb.rpc('rpc_get_public_po_comments', {
    p_token: token,
  });

  if (error) {
    throw new Error(error.message || 'Không thể tải lịch sử bình luận');
  }

  return data as PurchaseOrderComment[];
}

export async function addPublicPoComment(payload: {
  token: string;
  content: string;
}): Promise<{ success: boolean; comment_id: string }> {
  const { data, error } = await untypedDb.rpc('rpc_add_public_po_comment', {
    p_token: payload.token,
    p_content: payload.content,
  });

  if (error) {
    throw new Error(error.message || 'Không thể gửi bình luận');
  }

  return data as { success: boolean; comment_id: string };
}
