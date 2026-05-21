import type {
  Quotation,
  QuotationsFilter,
  QuotationStatus,
} from '@/domain/crm/quotations.types';
import { supabase } from '@/services/supabase/client';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';
import { validateApiInput } from '@/lib/validate-api-input';
import { apiQuotationHeader } from '@/schema/api-validation.schema';

const HEADER_TABLE = 'quotations';

/* ── Helper for salesperson boundary check ── */

async function getSalespersonCustomerIds(): Promise<string[] | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (userData?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, employee_id')
      .eq('id', userData.user.id)
      .single();
    if (profile?.role === 'sale' && profile.employee_id) {
      const { data: customerIdsData } = await supabase
        .from('customers')
        .select('id')
        .eq('salesperson_id', profile.employee_id);
      const customerIds = customerIdsData?.map((c) => c.id) || [];
      return customerIds.length > 0
        ? customerIds
        : ['00000000-0000-0000-0000-000000000000'];
    }
  }
  return null;
}

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

  const customerIds = await getSalespersonCustomerIds();
  if (customerIds) {
    query = query.in('customer_id', customerIds);
  }

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
  let query = supabase
    .from(HEADER_TABLE)
    .select('*, customers(name, code), quotation_items(*)')
    .eq('id', id);

  const customerIds = await getSalespersonCustomerIds();
  if (customerIds) {
    query = query.in('customer_id', customerIds);
  }

  const { data, error } = await query.single();
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
  validateApiInput(apiQuotationHeader.passthrough(), header);

  const customerIds = await getSalespersonCustomerIds();
  if (customerIds && !customerIds.includes(header.customer_id)) {
    throw new Error('Bạn không có quyền tạo báo giá cho khách hàng này.');
  }

  const { data, error } = await supabase.rpc('rpc_create_quotation', {
    p_header: header as never,
    p_items: items as never,
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
  const customerIds = await getSalespersonCustomerIds();
  if (customerIds && !customerIds.includes(header.customer_id)) {
    throw new Error('Bạn không có quyền cập nhật báo giá cho khách hàng này.');
  }
  if (customerIds) {
    const { count, error: checkError } = await supabase
      .from(HEADER_TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('id', id)
      .in('customer_id', customerIds);
    if (checkError || count === 0) {
      throw new Error('Bạn không có quyền cập nhật báo giá này.');
    }
  }

  const { error } = await supabase.rpc('rpc_update_quotation', {
    p_quotation_id: id,
    p_header: header as never,
    p_items: items as never,
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
  let query = supabase
    .from(HEADER_TABLE)
    .update({ status: 'sent' as QuotationStatus })
    .eq('id', id)
    .in('status', ['draft']);

  const customerIds = await getSalespersonCustomerIds();
  if (customerIds) {
    query = query.in('customer_id', customerIds);
  }

  const { error } = await query;
  if (error) throw error;
}

export async function confirmQuotation(id: string): Promise<void> {
  let query = supabase
    .from(HEADER_TABLE)
    .update({
      status: 'confirmed' as QuotationStatus,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .in('status', ['sent', 'draft']);

  const customerIds = await getSalespersonCustomerIds();
  if (customerIds) {
    query = query.in('customer_id', customerIds);
  }

  const { error } = await query;
  if (error) throw error;
}

export async function rejectQuotation(id: string): Promise<void> {
  let query = supabase
    .from(HEADER_TABLE)
    .update({ status: 'rejected' as QuotationStatus })
    .eq('id', id)
    .in('status', ['sent', 'draft']);

  const customerIds = await getSalespersonCustomerIds();
  if (customerIds) {
    query = query.in('customer_id', customerIds);
  }

  const { error } = await query;
  if (error) throw error;
}

export async function deleteQuotation(id: string): Promise<void> {
  let query = supabase.from(HEADER_TABLE).delete().eq('id', id);

  const customerIds = await getSalespersonCustomerIds();
  if (customerIds) {
    query = query.in('customer_id', customerIds);
  }

  const { error } = await query;
  if (error) throw error;
}

/* ── Expiring quotations count ── */

export async function fetchExpiringQuotationsCount(): Promise<{
  expiring: number;
  expired: number;
}> {
  const today = new Date().toISOString().slice(0, 10);
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const threeDaysLater = new Date(Date.now() + THREE_DAYS_MS)
    .toISOString()
    .slice(0, 10);

  let query1 = supabase
    .from(HEADER_TABLE)
    .select('*', {
      count: 'exact',
      head: true,
    })
    .in('status', ['draft', 'sent'])
    .gte('valid_until', today)
    .lte('valid_until', threeDaysLater);

  let query2 = supabase
    .from(HEADER_TABLE)
    .select('*', {
      count: 'exact',
      head: true,
    })
    .in('status', ['draft', 'sent'])
    .lt('valid_until', today);

  const customerIds = await getSalespersonCustomerIds();
  if (customerIds) {
    query1 = query1.in('customer_id', customerIds);
    query2 = query2.in('customer_id', customerIds);
  }

  const { count: expiringCount, error: err1 } = await query1;
  if (err1) throw err1;

  const { count: expiredCount, error: err2 } = await query2;
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
  const customerIds = await getSalespersonCustomerIds();
  if (customerIds) {
    const { count, error: checkError } = await supabase
      .from(HEADER_TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('id', quotationId)
      .in('customer_id', customerIds);
    if (checkError || count === 0) {
      throw new Error(
        'Bạn không có quyền chuyển đổi báo giá này thành đơn hàng.',
      );
    }
  }

  const { data, error } = await supabase.rpc('rpc_convert_quotation_to_order', {
    p_quotation_id: quotationId,
  });

  if (error) {
    if (error.message?.includes('QUOTATION_NOT_CONFIRMED')) {
      throw new Error('Chỉ có thể chuyển báo giá đã duyệt thành đơn hàng');
    }
    throw error;
  }

  return data as { orderId: string; orderNumber: string };
}
