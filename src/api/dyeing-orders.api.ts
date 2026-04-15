import type { DyeingOrderFormValues } from '@/schema/dyeing-order.schema';
import { supabase } from '@/services/supabase/client';
import { untypedDb as db } from '@/services/supabase/untyped';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';
import type {
  DyeingOrder,
  DyeingOrderFilter,
} from '@/features/dyeing-orders/types';

const TABLE = 'dyeing_orders';

/* ── List (paginated) ── */

export async function fetchDyeingOrdersPaginated(
  filters: DyeingOrderFilter = {},
  page = 1,
): Promise<PaginatedResult<DyeingOrder>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = db
    .from(TABLE)
    .select('*, suppliers(name, code)', { count: 'exact' })
    .order('order_date', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.supplierId) query = query.eq('supplier_id', filters.supplierId);
  if (filters.search?.trim())
    query = query.ilike('dyeing_order_number', `%${filters.search.trim()}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? 0;
  return {
    data: (data ?? []) as unknown as DyeingOrder[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  };
}

/* ── Single with items ── */

export async function fetchDyeingOrderById(id: string): Promise<DyeingOrder> {
  const { data, error } = await db
    .from(TABLE)
    .select(
      '*, suppliers(name, code), dyeing_order_items(*, raw_fabric_roll:raw_fabric_rolls(roll_number, fabric_type))',
    )
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as DyeingOrder;
}

/* ── Next number ── */

export async function fetchNextDyeingOrderNumber(): Promise<string> {
  const { fetchNextDocNumber, monthlyPrefix } =
    await import('@/api/helpers/next-doc-number');
  return fetchNextDocNumber({
    table: 'dyeing_orders',
    column: 'dyeing_order_number',
    prefix: monthlyPrefix('DN'),
  });
}

/* ── Fetch dyeing suppliers ── */

export async function fetchDyeingSuppliers(): Promise<
  { id: string; code: string; name: string }[]
> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, code, name')
    .eq('category', 'dye')
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return (data ?? []) as { id: string; code: string; name: string }[];
}

/* ── Create (header + items as draft) ── */

export async function createDyeingOrder(
  values: DyeingOrderFormValues,
): Promise<DyeingOrder> {
  const { data: userData } = await supabase.auth.getUser();

  const headerInsert = {
    dyeing_order_number: values.dyeing_order_number.trim(),
    supplier_id: values.supplier_id,
    order_date: values.order_date,
    expected_return_date: values.expected_return_date || null,
    unit_price_per_kg: values.unit_price_per_kg,
    work_order_id: values.work_order_id || null,
    notes: values.notes?.trim() || null,
    status: 'draft',
    created_by: userData.user?.id ?? null,
  };

  const itemsInsert = values.items.map(
    (item: DyeingOrderFormValues['items'][number], idx: number) => ({
      raw_fabric_roll_id: item.raw_fabric_roll_id,
      weight_kg: item.weight_kg,
      length_m: item.length_m || null,
      color_name: item.color_name.trim(),
      color_code: item.color_code?.trim() || null,
      notes: item.notes?.trim() || null,
      sort_order: idx,
    }),
  );

  const { data, error } = await db.rpc('atomic_create_dyeing_order', {
    p_header: headerInsert,
    p_items: itemsInsert,
  });

  if (error) throw error;
  return data as unknown as DyeingOrder;
}

/* ── Update (draft only) ── */

export async function updateDyeingOrder(
  id: string,
  values: DyeingOrderFormValues,
): Promise<void> {
  const headerUpdate = {
    dyeing_order_number: values.dyeing_order_number.trim(),
    supplier_id: values.supplier_id,
    order_date: values.order_date,
    expected_return_date: values.expected_return_date || null,
    unit_price_per_kg: values.unit_price_per_kg,
    work_order_id: values.work_order_id || null,
    notes: values.notes?.trim() || null,
  };

  const itemsInsert = values.items.map(
    (item: DyeingOrderFormValues['items'][number], idx: number) => ({
      raw_fabric_roll_id: item.raw_fabric_roll_id,
      weight_kg: item.weight_kg,
      length_m: item.length_m || null,
      color_name: item.color_name.trim(),
      color_code: item.color_code?.trim() || null,
      notes: item.notes?.trim() || null,
      sort_order: idx,
    }),
  );

  const { error } = await db.rpc('atomic_update_dyeing_order', {
    p_id: id,
    p_header: headerUpdate,
    p_items: itemsInsert,
  });

  if (error) {
    if (error.message?.includes('DYEING_ORDER_NOT_DRAFT'))
      throw new Error('Chi co the cap nhat lenh nhuom o trang thai nhap.');
    throw error;
  }
}

/* ── Send to dyeing (draft → sent) ── */

export async function sendDyeingOrder(id: string): Promise<void> {
  const { error } = await db
    .from(TABLE)
    .update({ status: 'sent' })
    .eq('id', id)
    .eq('status', 'draft');
  if (error) throw error;
}

/* ── Complete (receive finished fabric) — calls atomic RPC ── */

export async function completeDyeingOrder(
  id: string,
  actualReturnDate: string,
): Promise<void> {
  const { error } = await db.rpc('complete_dyeing_order', {
    p_dyeing_order_id: id,
    p_actual_return_date: actualReturnDate,
  });
  if (error) {
    if (error.message?.includes('DYEING_ORDER_NOT_FOUND'))
      throw new Error('Không tìm thấy lệnh nhuộm.');
    if (error.message?.includes('DYEING_ORDER_ALREADY_COMPLETED'))
      throw new Error('Lệnh nhuộm này đã hoàn thành rồi.');
    if (error.message?.includes('DYEING_ORDER_INVALID_STATUS'))
      throw new Error(
        'Lệnh nhuộm phải ở trạng thái "Đã gửi" hoặc "Đang nhuộm" mới có thể hoàn thành.',
      );
    throw error;
  }
}

/* ── Mark as paid ── */

export async function markDyeingOrderPaid(
  id: string,
  paidAmount: number,
): Promise<void> {
  const { error } = await db
    .from(TABLE)
    .update({ paid_amount: paidAmount })
    .eq('id', id);
  if (error) throw error;
}

/* ── Delete (draft only) ── */

export async function deleteDyeingOrder(id: string): Promise<void> {
  const { error } = await db.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
