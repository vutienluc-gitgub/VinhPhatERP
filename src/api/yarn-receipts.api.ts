import type { YarnReceipt, YarnReceiptsFilter } from '@/models';
import { supabase } from '@/services/supabase/client';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';

const HEADER_TABLE = 'yarn_receipts';
const ITEMS_TABLE = 'yarn_receipt_items';

export type YarnSupplierOption = { id: string; code: string; name: string };

export type YarnCatalogOption = {
  id: string;
  code: string;
  name: string;
  composition: string | null;
  color_name: string | null;
  tensile_strength: string | null;
  origin: string | null;
  unit: string;
};

export async function fetchYarnReceiptsPaginated(
  filters: YarnReceiptsFilter = {},
  page = 1,
): Promise<PaginatedResult<YarnReceipt>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from(HEADER_TABLE)
    .select('*, suppliers(name, code)', { count: 'exact' })
    .order('receipt_date', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.supplierId) query = query.eq('supplier_id', filters.supplierId);
  if (filters.dateFrom) query = query.gte('receipt_date', filters.dateFrom);
  if (filters.dateTo) query = query.lte('receipt_date', filters.dateTo);
  if (filters.search?.trim())
    query = query.ilike('receipt_number', `%${filters.search.trim()}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? 0;
  return {
    data: (data ?? []) as unknown as YarnReceipt[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  };
}

export async function fetchYarnReceiptById(id: string): Promise<YarnReceipt> {
  const { data, error } = await supabase
    .from(HEADER_TABLE)
    .select('*, suppliers(name, code), yarn_receipt_items(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as YarnReceipt;
}

export async function fetchNextReceiptNumber(): Promise<string> {
  const { data, error } = await supabase
    .from(HEADER_TABLE)
    .select('receipt_number')
    .ilike('receipt_number', 'NS-%')
    .order('receipt_number', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return 'NS-001';
  const last = data[0]?.receipt_number ?? '';
  const match = last.match(/^NS-(\d+)$/);
  if (!match?.[1]) return 'NS-001';
  return `NS-${String(parseInt(match[1], 10) + 1).padStart(3, '0')}`;
}

export async function fetchYarnSuppliers(): Promise<YarnSupplierOption[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, code, name')
    .eq('category', 'yarn')
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return (data ?? []) as YarnSupplierOption[];
}

export async function fetchYarnCatalogOptionsForReceipt(): Promise<
  YarnCatalogOption[]
> {
  const { data, error } = await supabase
    .from('yarn_catalogs')
    .select(
      'id, code, name, composition, color_name, tensile_strength, origin, unit',
    )
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return (data ?? []) as YarnCatalogOption[];
}

export type YarnReceiptCreateInput = {
  receiptNumber: string;
  supplierId: string;
  receiptDate: string;
  notes: string | null;
  items: {
    yarnType: string;
    colorName: string | null;
    quantity: number;
    unitPrice: number;
    lotNumber: string | null;
    tensileStrength: string | null;
    composition: string | null;
    origin: string | null;
    yarnCatalogId: string | null;
  }[];
};

export async function createYarnReceiptFull(
  input: YarnReceiptCreateInput,
): Promise<YarnReceipt> {
  const { data: header, error: headerErr } = await supabase
    .from(HEADER_TABLE)
    .insert({
      receipt_number: input.receiptNumber.trim(),
      supplier_id: input.supplierId,
      receipt_date: input.receiptDate,
      notes: input.notes,
      status: 'draft' as const,
    })
    .select(
      'id, receipt_number, supplier_id, receipt_date, total_amount, status, notes, created_by, created_at, updated_at',
    )
    .single();

  if (headerErr) throw headerErr;

  const headerId = header.id;
  const items = input.items.map((item, idx) => ({
    receipt_id: headerId,
    yarn_type: item.yarnType.trim(),
    color_name: item.colorName?.trim() || null,
    unit: 'kg',
    quantity: item.quantity,
    unit_price: item.unitPrice,
    lot_number: item.lotNumber?.trim() || null,
    tensile_strength: item.tensileStrength?.trim() || null,
    composition: item.composition?.trim() || null,
    origin: item.origin?.trim() || null,
    yarn_catalog_id: item.yarnCatalogId?.trim() || null,
    sort_order: idx,
  }));

  const { error: itemsErr } = await supabase.from(ITEMS_TABLE).insert(items);
  if (itemsErr) {
    await supabase.from(HEADER_TABLE).delete().eq('id', headerId);
    throw itemsErr;
  }

  const total = input.items.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0,
  );
  await supabase
    .from(HEADER_TABLE)
    .update({ total_amount: total })
    .eq('id', headerId);

  return header as YarnReceipt;
}

export async function updateYarnReceiptFull(
  id: string,
  input: YarnReceiptCreateInput,
): Promise<void> {
  const total = input.items.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0,
  );

  const { error: headerErr } = await supabase
    .from(HEADER_TABLE)
    .update({
      receipt_number: input.receiptNumber.trim(),
      supplier_id: input.supplierId,
      receipt_date: input.receiptDate,
      notes: input.notes,
      total_amount: total,
    })
    .eq('id', id);

  if (headerErr) throw headerErr;

  const { error: delErr } = await supabase
    .from(ITEMS_TABLE)
    .delete()
    .eq('receipt_id', id);
  if (delErr) throw delErr;

  const items = input.items.map((item, idx) => ({
    receipt_id: id,
    yarn_type: item.yarnType.trim(),
    color_name: item.colorName?.trim() || null,
    unit: 'kg',
    quantity: item.quantity,
    unit_price: item.unitPrice,
    lot_number: item.lotNumber?.trim() || null,
    tensile_strength: item.tensileStrength?.trim() || null,
    composition: item.composition?.trim() || null,
    origin: item.origin?.trim() || null,
    yarn_catalog_id: item.yarnCatalogId?.trim() || null,
    sort_order: idx,
  }));

  const { error: insertErr } = await supabase.from(ITEMS_TABLE).insert(items);
  if (insertErr) throw insertErr;
}

export async function deleteYarnReceiptRecord(id: string): Promise<void> {
  const { error } = await supabase.from(HEADER_TABLE).delete().eq('id', id);
  if (error) throw error;
}

export async function confirmYarnReceipt(id: string): Promise<void> {
  const { error } = await supabase
    .from(HEADER_TABLE)
    .update({ status: 'confirmed' })
    .eq('id', id)
    .eq('status', 'draft')
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Phiếu không tồn tại hoặc đã được xác nhận trước đó.');
    }
    throw error;
  }
}
