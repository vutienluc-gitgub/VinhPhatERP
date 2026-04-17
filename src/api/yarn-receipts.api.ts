import type {
  YarnReceipt,
  YarnReceiptsFilter,
} from '@/features/yarn-receipts/types';
import { supabase } from '@/services/supabase/client';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';

const HEADER_TABLE = 'yarn_receipts';

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
  if (filters.search?.trim()) {
    const q = filters.search.trim();

    // Buoc 1: Tim nha cung cap co ten khop tu khoa
    const { data: matchedSuppliers } = await supabase
      .from('suppliers')
      .select('id')
      .ilike('name', `%${q}%`);

    const supplierIds = (matchedSuppliers ?? []).map((s) => s.id);

    // Buoc 2: Ket hop OR tren bang chinh (receipt_number, notes, supplier_id)
    if (supplierIds.length > 0) {
      query = query.or(
        `receipt_number.ilike.%${q}%,notes.ilike.%${q}%,supplier_id.in.(${supplierIds.join(',')})`,
      );
    } else {
      query = query.or(`receipt_number.ilike.%${q}%,notes.ilike.%${q}%`);
    }
  }

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
  const { fetchNextDocNumber } = await import('@/api/helpers/next-doc-number');
  return fetchNextDocNumber({
    table: 'yarn_receipts',
    column: 'receipt_number',
    prefix: 'NS-',
    pad: 3,
  });
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
  /** Only used for updates; create auto-generates via RPC */
  receiptNumber?: string;
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
  const { getTenantId } = await import('@/services/supabase/tenant');
  const tenantId = await getTenantId();

  const total = input.items.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0,
  );

  const headerInsert = {
    supplier_id: input.supplierId,
    receipt_date: input.receiptDate,
    notes: input.notes,
    status: 'draft',
    total_amount: total,
    tenant_id: tenantId,
  };

  const itemsInsert = input.items.map((item, idx) => ({
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

  const { data, error } = await supabase.rpc('rpc_create_yarn_receipt', {
    p_header: headerInsert as unknown as never,
    p_items: itemsInsert as unknown as never[],
  });

  if (error) throw error;
  return data as unknown as YarnReceipt;
}

export async function updateYarnReceiptFull(
  id: string,
  input: YarnReceiptCreateInput,
): Promise<void> {
  const { getTenantId } = await import('@/services/supabase/tenant');
  const tenantId = await getTenantId();

  const total = input.items.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0,
  );

  const headerUpdate = {
    receipt_number: input.receiptNumber?.trim() || null,
    supplier_id: input.supplierId,
    receipt_date: input.receiptDate,
    notes: input.notes || null,
    total_amount: total,
    tenant_id: tenantId,
  };

  const itemsInsert = input.items.map((item, idx) => ({
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

  const { error } = await supabase.rpc('rpc_update_yarn_receipt', {
    p_id: id,
    p_header: headerUpdate as unknown as never,
    p_items: itemsInsert as unknown as never[],
  });

  if (error) throw error;
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
