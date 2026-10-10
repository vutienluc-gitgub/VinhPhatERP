import { untypedDb } from '@/services/supabase/client';
import type { PurchaseOrderComment } from '@/domain/purchase-orders';
import { safeUpsert } from '@/lib/db-guard';

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
