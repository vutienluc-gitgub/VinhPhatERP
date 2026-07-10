import { untypedDb } from '@/services/supabase/client';
import { getTenantId } from '@/services/supabase/tenant';
import { safeUpsert } from '@/lib/db-guard';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';
import type { RfqFormValues } from '@/schema/sourcing-rfq.schema';
import type { PurchaseRequestItem } from '@/api/purchase-requests.api';

/* ── Types ── */

export type SourcingRfq = {
  id: string;
  rfq_code: string;
  title: string;
  deadline_date: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  item_count?: number;
};

export type SourcingRfqItem = {
  id: string;
  rfq_id: string;
  pr_item_id: string | null;
  material_id: string | null;
  material_name: string;
  material_specs: string | null;
  qty_required: number;
  uom: string;
};

export type PendingPrItem = PurchaseRequestItem & {
  pr_no: string;
  requester_dept: string | null;
};

export type SupplierQuoteItem = {
  id: string;
  rfq_item_id: string;
  unit_price: number;
  qty_offered: number;
  notes: string | null;
  material_name?: string;
  material_id?: string | null;
  uom?: string;
  qty_required?: number;
};

export type SupplierQuote = {
  id: string;
  rfq_id: string;
  supplier_name: string;
  supplier_phone: string;
  status: string;
  notes: string | null;
  created_at: string;
  items?: SupplierQuoteItem[];
};

export type RfqFilter = {
  status?: string;
  search?: string;
};

/* ── Queries ── */

/**
 * Fetch all PR Items that belong to an approved PR, but haven't been assigned to an RFQ yet.
 */
export async function fetchPendingPrItems(): Promise<PendingPrItem[]> {
  // To keep it simple, we do a join using PostgREST syntax on untypedDb
  const { data, error } = await untypedDb
    .from('purchase_request_items')
    .select(
      `
      *,
      purchase_requests!inner (
        pr_no,
        requester_dept,
        status
      ),
      sourcing_rfq_items (
        id
      )
    `,
    )
    .eq('purchase_requests.status', 'approved');

  if (error) throw error;

  // Filter out items that already have an RFQ
  type DbPrItem = {
    id: string;
    pr_id: string;
    material_name: string;
    material_specs: string | null;
    qty_required: number;
    uom: string;
    expected_date: string | null;
    purpose: string | null;
    purchase_requests: {
      pr_no: string;
      requester_dept: string | null;
      status: string;
    };
    sourcing_rfq_items: { id: string }[];
  };

  const pendingItems = ((data as unknown as DbPrItem[]) ?? []).filter(
    (item) => !item.sourcing_rfq_items || item.sourcing_rfq_items.length === 0,
  );

  return pendingItems.map((item) => ({
    id: item.id,
    pr_id: item.pr_id,
    material_name: item.material_name,
    material_specs: item.material_specs,
    qty_required: item.qty_required,
    uom: item.uom,
    expected_date: item.expected_date,
    purpose: item.purpose,
    pr_no: item.purchase_requests.pr_no,
    requester_dept: item.purchase_requests.requester_dept,
  }));
}

export async function fetchRFQs(
  filters: RfqFilter = {},
  page = 1,
): Promise<PaginatedResult<SourcingRfq>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = untypedDb
    .from('sourcing_rfqs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status as never);
  if (filters.search) {
    query = query.or(
      `rfq_code.ilike.%${filters.search}%,title.ilike.%${filters.search}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const total = count ?? 0;
  return {
    data: (data ?? []) as SourcingRfq[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  };
}

export async function fetchRFQById(id: string): Promise<SourcingRfq> {
  const { data, error } = await untypedDb
    .from('sourcing_rfqs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as SourcingRfq;
}

export async function fetchRFQItems(rfqId: string): Promise<SourcingRfqItem[]> {
  const { data, error } = await untypedDb
    .from('sourcing_rfq_items')
    .select('*')
    .eq('rfq_id', rfqId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as SourcingRfqItem[];
}

export async function fetchNextRfqCode(): Promise<string> {
  const { data, error } = await untypedDb
    .from('sourcing_rfqs')
    .select('rfq_code')
    .ilike('rfq_code', 'RFQ-%')
    .order('rfq_code', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return 'RFQ-0001';

  const last = (data[0] as { rfq_code: string }).rfq_code ?? '';
  const match = last.match(/^RFQ-(\d+)$/);
  if (!match?.[1]) return 'RFQ-0001';
  return `RFQ-${String(parseInt(match[1], 10) + 1).padStart(4, '0')}`;
}

/* ── Mutations ── */

export async function createRFQ(
  values: RfqFormValues,
  pendingItems: PendingPrItem[],
): Promise<SourcingRfq> {
  const tenantId = await getTenantId();
  const rfqCode = await fetchNextRfqCode();
  const rfqId = crypto.randomUUID();

  // 1. Create RFQ Header
  const headerResult = await safeUpsert({
    table: 'sourcing_rfqs',
    data: {
      id: rfqId,
      tenant_id: tenantId,
      rfq_code: rfqCode,
      title: values.title.trim(),
      deadline_date: values.deadline_date,
      status: 'open',
      notes: values.notes?.trim() || null,
    },
    conflictKey: 'id',
  });

  // 2. Insert RFQ Items mapping from PR Items
  const rfqItemsData = values.items
    .map((mappedItem) => {
      const prItem = pendingItems.find((i) => i.id === mappedItem.pr_item_id);
      if (!prItem) return null;
      return {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        rfq_id: rfqId,
        pr_item_id: mappedItem.pr_item_id,
        material_id: mappedItem.material_id, // Now it has material_id from the mapping
        material_name: prItem.material_name,
        material_specs: prItem.material_specs,
        qty_required: prItem.qty_required,
        uom: prItem.uom,
      };
    })
    .filter(Boolean) as (SourcingRfqItem & { tenant_id: string })[];

  if (rfqItemsData.length > 0) {
    await safeUpsert({
      table: 'sourcing_rfq_items',
      data: rfqItemsData,
      conflictKey: 'id',
    });
  }

  // 3. Update PR status to 'sourcing'
  const prIdsToUpdate = Array.from(
    new Set(
      values.items
        .map((i) => {
          const prItem = pendingItems.find((p) => p.id === i.pr_item_id);
          return prItem?.pr_id;
        })
        .filter(Boolean),
    ),
  ) as string[];

  if (prIdsToUpdate.length > 0) {
    const { error: prError } = await untypedDb
      .from('purchase_requests')
      .update({ status: 'sourcing', updated_at: new Date().toISOString() })
      .in('id', prIdsToUpdate);

    if (prError) {
      console.error('[UpdatePRStatusError]', prError);
    }
  }

  const header = Array.isArray(headerResult) ? headerResult[0] : headerResult;
  return header as unknown as SourcingRfq;
}

export async function updateRfqStatus(
  id: string,
  status: string,
): Promise<void> {
  const { error } = await untypedDb
    .from('sourcing_rfqs')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteRFQ(id: string): Promise<void> {
  const { error } = await untypedDb.from('sourcing_rfqs').delete().eq('id', id);

  if (error) throw error;
}

export async function fetchRFQQuotes(rfqId: string): Promise<SupplierQuote[]> {
  const tenantId = getTenantId();

  // Fetch quotes
  const { data: quotesData, error: quotesError } = await untypedDb
    .from('supplier_quotes')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('rfq_id', rfqId)
    .order('created_at', { ascending: false });

  if (quotesError) throw quotesError;
  if (!quotesData || quotesData.length === 0) return [];

  // Fetch quote items and join with rfq items for material info
  const quoteIds = quotesData.map((q) => q.id);
  const { data: itemsData, error: itemsError } = await untypedDb
    .from('supplier_quote_items')
    .select(
      `
      id, rfq_item_id, unit_price, qty_offered, notes, quote_id
    `,
    )
    .eq('tenant_id', tenantId)
    .in('quote_id', quoteIds);

  if (itemsError) throw itemsError;

  // We also need the material details from sourcing_rfq_items
  const { data: rfqItems, error: rfqItemsError } = await untypedDb
    .from('sourcing_rfq_items')
    .select('id, material_name, material_id, uom, qty_required')
    .eq('tenant_id', tenantId)
    .eq('rfq_id', rfqId);

  if (rfqItemsError) throw rfqItemsError;

  // Assemble the result
  return quotesData.map((quote) => {
    const qItems = itemsData?.filter((i) => i.quote_id === quote.id) || [];

    const enrichedItems: SupplierQuoteItem[] = qItems.map((qi) => {
      const rItem = rfqItems?.find((ri) => ri.id === qi.rfq_item_id);
      return {
        id: qi.id,
        rfq_item_id: qi.rfq_item_id,
        unit_price: qi.unit_price,
        qty_offered: qi.qty_offered,
        notes: qi.notes,
        material_name: rItem?.material_name,
        material_id: rItem?.material_id,
        uom: rItem?.uom,
        qty_required: rItem?.qty_required,
      };
    });

    return {
      id: quote.id,
      rfq_id: quote.rfq_id,
      supplier_name: quote.supplier_name,
      supplier_phone: quote.supplier_phone,
      status: quote.status,
      notes: quote.notes,
      created_at: quote.created_at,
      items: enrichedItems,
    };
  });
}

export async function awardRFQQuote(quoteId: string): Promise<void> {
  const { error } = await untypedDb.rpc('rpc_award_supplier_quote', {
    p_quote_id: quoteId,
  });

  if (error) throw error;
}
