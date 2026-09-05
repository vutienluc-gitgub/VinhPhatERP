import { untypedDb } from '@/services/supabase/client';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';
import type { PrHeaderFormValues } from '@/schema/purchase-request.schema';

/* ── Types ── */

export type PurchaseRequest = {
  id: string;
  pr_no: string;
  requester_dept: string | null;
  priority: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  item_count?: number;
};

export type PurchaseRequestItem = {
  id: string;
  pr_id: string;
  material_name: string;
  material_specs: string | null;
  qty_required: number;
  uom: string;
  expected_date: string | null;
  purpose: string | null;
};

export type PrFilter = {
  status?: string;
  search?: string;
  priority?: string;
};

/* ── Queries ── */

export async function fetchPurchaseRequests(
  filters: PrFilter = {},
  page = 1,
): Promise<PaginatedResult<PurchaseRequest>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = untypedDb
    .from('purchase_requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status as never);
  if (filters.priority) query = query.eq('priority', filters.priority as never);
  if (filters.search) {
    query = query.or(
      `pr_no.ilike.%${filters.search}%,requester_dept.ilike.%${filters.search}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const total = count ?? 0;
  return {
    data: (data ?? []) as PurchaseRequest[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  };
}

export async function fetchPurchaseRequestItems(
  prId: string,
): Promise<PurchaseRequestItem[]> {
  const { data, error } = await untypedDb
    .from('purchase_request_items')
    .select('*')
    .eq('pr_id', prId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as PurchaseRequestItem[];
}

export async function fetchNextPrNo(): Promise<string> {
  const { data, error } = await untypedDb
    .from('purchase_requests')
    .select('pr_no')
    .ilike('pr_no', 'PR-%')
    .order('pr_no', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return 'PR-0001';

  const last = (data[0] as { pr_no: string }).pr_no ?? '';
  const match = last.match(/^PR-(\d+)$/);
  if (!match?.[1]) return 'PR-0001';
  return `PR-${String(parseInt(match[1], 10) + 1).padStart(4, '0')}`;
}

/* ── Mutations ── */

export async function createPurchaseRequest(
  values: PrHeaderFormValues,
): Promise<PurchaseRequest> {
  const { data: prId, error: rpcError } = await untypedDb.rpc(
    'rpc_create_purchase_request',
    {
      p_requester_dept: values.requester_dept.trim(),
      p_priority: values.priority,
      p_notes: values.notes?.trim() || null,
      p_items: values.items.map((item) => ({
        material_name: item.material_name.trim(),
        material_specs: item.material_specs?.trim() || null,
        qty_required: item.qty_required,
        uom: item.uom.trim(),
        expected_date: item.expected_date || null,
        purpose: item.purpose?.trim() || null,
      })),
    },
  );

  if (rpcError) {
    throw rpcError;
  }

  const { data: pr, error: fetchError } = await untypedDb
    .from('purchase_requests')
    .select('*')
    .eq('id', prId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  return pr as PurchaseRequest;
}

export async function deletePurchaseRequest(id: string): Promise<void> {
  const { error } = await untypedDb
    .from('purchase_requests')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
