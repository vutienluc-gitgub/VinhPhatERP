import type {
  Quotation,
  QuotationsFilter,
  QuotationStatus,
} from '@/features/quotations/types';
import { supabase } from '@/services/supabase/client';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';
import { untypedDb } from '@/services/supabase/untyped';

const HEADER_TABLE = 'quotations';

/* ── Fetch list with pagination ── */

export async function fetchQuotationsPaginated(
  filters: QuotationsFilter = {},
  page = 1,
): Promise<PaginatedResult<Quotation>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from(HEADER_TABLE)
    .select('*, customers(name, code)', { count: 'exact' })
    .order('quotation_date', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.customerId) query = query.eq('customer_id', filters.customerId);
  if (filters.search?.trim()) {
    const term = filters.search.trim();
    const { data: cus } = await supabase
      .from('customers')
      .select('id')
      .ilike('name', `%${term}%`);
    const cIds = cus?.map((c) => c.id) || [];
    if (cIds.length > 0) {
      query = query.or(
        `quotation_number.ilike.%${term}%,customer_id.in.(${cIds.join(',')})`,
      );
    } else {
      query = query.or(`quotation_number.ilike.%${term}%`);
    }
  }

  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? 0;
  return {
    data: (data ?? []) as unknown as Quotation[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  };
}

/* ── Single quotation with items ── */

export async function fetchQuotationById(id: string): Promise<Quotation> {
  const { data, error } = await supabase
    .from(HEADER_TABLE)
    .select('*, customers(name, code), quotation_items(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as Quotation;
}

/* ── Generate next quotation number ── */

export async function fetchNextQuotationNumber(): Promise<string> {
  const { fetchNextDocNumber, monthlyPrefix } =
    await import('@/api/helpers/next-doc-number');
  return fetchNextDocNumber({
    table: 'quotations',
    column: 'quotation_number',
    prefix: monthlyPrefix('BG'),
  });
}

/* ── Create quotation (header + items) ── */

type QuotationHeaderInsert = {
  quotation_number: string;
  customer_id: string;
  quotation_date: string;
  valid_until: string | null;
  subtotal: number;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  total_before_vat: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  delivery_terms: string | null;
  payment_terms: string | null;
  notes: string | null;
  status: 'draft';
};

type QuotationItemInsert = {
  quotation_id: string;
  fabric_type: string;
  color_name: string | null;
  color_code: string | null;
  width_cm: number | null;
  unit: string;
  quantity: number;
  unit_price: number;
  lead_time_days: number | null;
  notes: string | null;
  sort_order: number;
};

export async function createQuotation(
  header: QuotationHeaderInsert,
  items: Omit<QuotationItemInsert, 'quotation_id'>[],
): Promise<Quotation> {
  const { data, error } = await untypedDb.rpc('rpc_create_quotation', {
    p_header: header,
    p_items: items,
  });

  if (error) throw error;
  return data as unknown as Quotation;
}

/* ── Update quotation header + replace items ── */

export async function updateQuotationWithItems(
  id: string,
  header: Omit<QuotationHeaderInsert, 'status'>,
  items: Omit<QuotationItemInsert, 'quotation_id'>[],
): Promise<void> {
  const { error } = await untypedDb.rpc('rpc_update_quotation', {
    p_quotation_id: id,
    p_header: header,
    p_items: items,
  });

  if (error) {
    if (error.message?.includes('QUOTATION_NOT_DRAFT')) {
      throw new Error(
        'Chỉ có thể sửa khi báo giá đang ở trạng thái Nháp (Draft).',
      );
    }
    throw error;
  }
}

/* ── Status transitions ── */

export async function sendQuotation(id: string): Promise<void> {
  const { error } = await supabase
    .from(HEADER_TABLE)
    .update({ status: 'sent' as QuotationStatus })
    .eq('id', id)
    .in('status', ['draft']);
  if (error) throw error;
}

export async function confirmQuotation(id: string): Promise<void> {
  const { error } = await supabase
    .from(HEADER_TABLE)
    .update({
      status: 'confirmed' as QuotationStatus,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .in('status', ['sent', 'draft']);
  if (error) throw error;
}

export async function rejectQuotation(id: string): Promise<void> {
  const { error } = await supabase
    .from(HEADER_TABLE)
    .update({ status: 'rejected' as QuotationStatus })
    .eq('id', id)
    .in('status', ['sent', 'draft']);
  if (error) throw error;
}

export async function deleteQuotation(id: string): Promise<void> {
  const { error } = await supabase.from(HEADER_TABLE).delete().eq('id', id);
  if (error) throw error;
}

/* ── Expiring quotations count ── */

export async function fetchExpiringQuotationsCount(): Promise<{
  expiring: number;
  expired: number;
}> {
  const today = new Date().toISOString().slice(0, 10);
  const threeDaysLater = new Date(Date.now() + 3 * 86400000)
    .toISOString()
    .slice(0, 10);

  const { count: expiringCount, error: err1 } = await supabase
    .from(HEADER_TABLE)
    .select('*', {
      count: 'exact',
      head: true,
    })
    .in('status', ['draft', 'sent'])
    .gte('valid_until', today)
    .lte('valid_until', threeDaysLater);
  if (err1) throw err1;

  const { count: expiredCount, error: err2 } = await supabase
    .from(HEADER_TABLE)
    .select('*', {
      count: 'exact',
      head: true,
    })
    .in('status', ['draft', 'sent'])
    .lt('valid_until', today);
  if (err2) throw err2;

  return {
    expiring: expiringCount ?? 0,
    expired: expiredCount ?? 0,
  };
}

/* ── Convert quotation to order ── */

export async function convertQuotationToOrder(
  quotationId: string,
): Promise<{ orderId: string; orderNumber: string }> {
  const { data, error } = await untypedDb.rpc(
    'rpc_convert_quotation_to_order',
    {
      p_quotation_id: quotationId,
    },
  );

  if (error) {
    if (error.message?.includes('QUOTATION_NOT_CONFIRMED')) {
      throw new Error('Chỉ có thể chuyển báo giá đã duyệt thành đơn hàng');
    }
    throw error;
  }

  return data as { orderId: string; orderNumber: string };
}
