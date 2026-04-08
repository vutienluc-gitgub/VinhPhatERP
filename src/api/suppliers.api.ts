import type { Supplier, SupplierInsert, SupplierUpdate } from '@/models';
import { supabase } from '@/services/supabase/client';
import { untypedDb } from '@/services/supabase/untyped';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';

const TABLE = 'suppliers';

export type SupplierFilter = {
  status?: string;
  category?: string;
  search?: string;
};

export async function fetchSuppliersPaginated(
  filters: SupplierFilter = {},
  page = 1,
): Promise<PaginatedResult<Supplier>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = untypedDb
    .from(TABLE)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.category) query = query.eq('category', filters.category);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? 0;
  return {
    data: (data ?? []) as Supplier[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  };
}

export async function fetchSuppliers(
  filters: { status?: string; category?: string; search?: string } = {},
): Promise<Supplier[]> {
  let query = untypedDb
    .from(TABLE)
    .select('*')
    .order('name', { ascending: true });
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,phone.ilike.%${q}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Supplier[];
}

export async function fetchNextSupplierCode(): Promise<string> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('code')
    .ilike('code', 'NCC-%')
    .order('code', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return 'NCC-001';
  const last = data[0]?.code ?? '';
  const match = last.match(/^NCC-(\d+)$/);
  if (!match?.[1]) return 'NCC-001';
  return `NCC-${String(parseInt(match[1], 10) + 1).padStart(3, '0')}`;
}

export async function createSupplier(row: SupplierInsert): Promise<Supplier> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([row])
    .select()
    .single();
  if (error) throw error;
  return data as Supplier;
}

export async function updateSupplierRpc(
  id: string,
  row: Record<string, unknown>,
): Promise<unknown> {
  const { data, error } = await untypedDb.rpc('update_supplier', {
    p_id: id,
    ...row,
  });
  if (error) {
    if (error.message.includes('NOT_AUTHENTICATED'))
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    if (error.message.includes('FORBIDDEN'))
      throw new Error(
        'Bạn không có quyền cập nhật nhà cung cấp. Liên hệ admin.',
      );
    if (error.message.includes('NOT_FOUND'))
      throw new Error('Bản ghi không tồn tại hoặc đã bị xóa.');
    throw error;
  }
  return data;
}

export async function updateSupplier(
  id: string,
  row: SupplierUpdate,
): Promise<Supplier> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Supplier;
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
