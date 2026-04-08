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
const ITEMS_TABLE = 'dyeing_order_items';

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
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `DN${yy}${mm}-`;

  const { data, error } = await db
    .from(TABLE)
    .select('dyeing_order_number')
    .ilike('dyeing_order_number', `${prefix}%`)
    .order('dyeing_order_number', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return `${prefix}0001`;
  const last = data[0]?.dyeing_order_number ?? '';
  const match = last.match(/(\d{4})$/);
  if (!match?.[1]) return `${prefix}0001`;
  return `${prefix}${String(parseInt(match[1], 10) + 1).padStart(4, '0')}`;
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

  const { data: header, error: headerErr } = await db
    .from(TABLE)
    .insert({
      dyeing_order_number: values.dyeing_order_number.trim(),
      supplier_id: values.supplier_id,
      order_date: values.order_date,
      expected_return_date: values.expected_return_date || null,
      unit_price_per_kg: values.unit_price_per_kg,
      work_order_id: values.work_order_id || null,
      notes: values.notes?.trim() || null,
      status: 'draft',
      created_by: userData.user?.id ?? null,
    })
    .select('id')
    .single();

  if (headerErr) throw headerErr;

  const items = values.items.map(
    (item: DyeingOrderFormValues['items'][number], idx: number) => ({
      dyeing_order_id: header.id,
      raw_fabric_roll_id: item.raw_fabric_roll_id,
      weight_kg: item.weight_kg,
      length_m: item.length_m || null,
      color_name: item.color_name.trim(),
      color_code: item.color_code?.trim() || null,
      notes: item.notes?.trim() || null,
      sort_order: idx,
    }),
  );

  const { error: itemsErr } = await db.from(ITEMS_TABLE).insert(items);
  if (itemsErr) {
    await db.from(TABLE).delete().eq('id', header.id);
    throw itemsErr;
  }

  return fetchDyeingOrderById(header.id);
}

/* ── Update (draft only) ── */

export async function updateDyeingOrder(
  id: string,
  values: DyeingOrderFormValues,
): Promise<void> {
  const { error: headerErr } = await db
    .from(TABLE)
    .update({
      dyeing_order_number: values.dyeing_order_number.trim(),
      supplier_id: values.supplier_id,
      order_date: values.order_date,
      expected_return_date: values.expected_return_date || null,
      unit_price_per_kg: values.unit_price_per_kg,
      work_order_id: values.work_order_id || null,
      notes: values.notes?.trim() || null,
    })
    .eq('id', id)
    .eq('status', 'draft');

  if (headerErr) throw headerErr;

  // Replace items
  const { error: delErr } = await db
    .from(ITEMS_TABLE)
    .delete()
    .eq('dyeing_order_id', id);
  if (delErr) throw delErr;

  const items = values.items.map(
    (item: DyeingOrderFormValues['items'][number], idx: number) => ({
      dyeing_order_id: id,
      raw_fabric_roll_id: item.raw_fabric_roll_id,
      weight_kg: item.weight_kg,
      length_m: item.length_m || null,
      color_name: item.color_name.trim(),
      color_code: item.color_code?.trim() || null,
      notes: item.notes?.trim() || null,
      sort_order: idx,
    }),
  );

  const { error: insertErr } = await db.from(ITEMS_TABLE).insert(items);
  if (insertErr) throw insertErr;
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
