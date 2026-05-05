import type {
  Supplier,
  SupplierInsert,
  SupplierUpdate,
} from '@/domain/crm/suppliers.types';
import { supabase, untypedDb } from '@/services/supabase/client';
import { getTenantId } from '@/services/supabase/tenant';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';
import { safeUpsert } from '@/lib/db-guard';
import { validateApiInput } from '@/lib/validate-api-input';
import { apiSupplierInsert } from '@/schema/api-validation.schema';

const TABLE = 'suppliers';

export type SupplierPrice = {
  unit_price: number;
  uom: string;
  moq: number;
  lead_time_days: number;
};

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
    .from('v_supplier_full')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.category) query = query.eq('category', filters.category as never);
  if (filters.status) query = query.eq('status', filters.status as never);
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
    .from('v_supplier_full')
    .select('*')
    .order('name', { ascending: true });
  if (filters.status) query = query.eq('status', filters.status as never);
  if (filters.category) query = query.eq('category', filters.category as never);
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
  validateApiInput(apiSupplierInsert.passthrough(), row);
  const tenantId = await getTenantId();

  const sanitizedRow = {
    ...row,
    email: row.email?.trim() || null,
    phone: row.phone?.trim() || null,
    tax_code: row.tax_code?.trim() || null,
  };

  // 1. Kiểm tra tồn tại trước khi insert (Database Safety)
  if (sanitizedRow.code || sanitizedRow.email || sanitizedRow.phone) {
    const promises = [];
    if (sanitizedRow.code) {
      promises.push(
        supabase
          .from(TABLE)
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('code', sanitizedRow.code),
      );
    }
    if (sanitizedRow.email) {
      promises.push(
        supabase
          .from(TABLE)
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('email', sanitizedRow.email),
      );
    }
    if (sanitizedRow.phone) {
      promises.push(
        supabase
          .from(TABLE)
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('phone', sanitizedRow.phone),
      );
    }

    if (promises.length > 0) {
      const results = await Promise.all(promises);
      const hasDuplicate = results.some(
        (res) => !res.error && res.data && res.data.length > 0,
      );

      if (hasDuplicate) {
        throw new Error(
          'Nhà cung cấp đã tồn tại (trùng Mã, Email hoặc SDT). Vui lòng kiểm tra lại.',
        );
      }
    }
  }

  // 2. Insert an toàn
  try {
    const inserted = await safeUpsert({
      table: TABLE,
      data: {
        ...sanitizedRow,
        id: crypto.randomUUID(),
        tenant_id: tenantId,
      },
      conflictKey: 'id',
    });

    if (Array.isArray(inserted) && inserted.length > 0) {
      return inserted[0] as unknown as Supplier;
    }
    return inserted as unknown as Supplier;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === '23505'
    ) {
      throw new Error(
        'Nhà cung cấp bị trùng lặp dữ liệu (Unique Constraint) trong hệ thống.',
      );
    }
    throw error;
  }
}

export async function updateSupplierRpc(
  id: string,
  row: SupplierUpdate,
  expectedUpdatedAt?: string,
): Promise<unknown> {
  // Use untypedDb because generated types still declare p_category as enum supplier_category
  // After `supabase gen types`, migrate back to typed `supabase` client
  const { data, error } = await untypedDb.rpc('rpc_update_supplier', {
    p_id: id,
    p_code: row.code!,
    p_name: row.name!,
    p_category: row.category,
    p_phone: row.phone ?? undefined,
    p_email: row.email ?? undefined,
    p_address: row.address ?? undefined,
    p_tax_code: row.tax_code ?? undefined,
    p_contact_person: row.contact_person ?? undefined,
    p_notes: row.notes ?? undefined,
    p_status: row.status ?? undefined,
    p_expected_updated_at: expectedUpdatedAt,
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
    if (error.message.includes('INVALID_CATEGORY'))
      throw new Error('Danh mục nhà cung cấp không hợp lệ. Vui lòng chọn lại.');
    throw new Error(
      error.message || 'Lỗi không xác định khi cập nhật nhà cung cấp.',
    );
  }
  return data;
}

export async function updateSupplier(
  id: string,
  row: SupplierUpdate,
  expectedUpdatedAt?: string,
): Promise<Supplier> {
  const sanitizedRow = {
    ...row,
    email: row.email?.trim() || null,
    phone: row.phone?.trim() || null,
    tax_code: row.tax_code?.trim() || null,
  };

  let query = supabase
    .from(TABLE)
    .update(sanitizedRow as SupplierUpdate)
    .eq('id', id);

  if (expectedUpdatedAt) {
    query = query.eq('updated_at', expectedUpdatedAt);
  }

  const { data, error } = await query.select().single();

  if (error) {
    if (error.code === 'PGRST116' && expectedUpdatedAt) {
      throw new Error(
        'Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.',
      );
    }
    if (error.code === '23505') {
      throw new Error(
        'Cập nhật thất bại: Mã, Email hoặc SDT đã được sử dụng bởi đối tác khác.',
      );
    }
    throw error;
  }
  return data as Supplier;
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

export async function fetchSupplierPrice(
  supplierId: string,
  materialId: string,
): Promise<SupplierPrice | null> {
  if (!supplierId || !materialId) return null;
  const { data, error } = await untypedDb.rpc('rpc_get_supplier_price', {
    p_supplier_id: supplierId,
    p_material_id: materialId,
  });
  if (error) throw error;
  if (!data || !Array.isArray(data) || data.length === 0) return null;
  return data[0] as SupplierPrice;
}

export async function fetchAllSupplierPrices(
  supplierId: string,
): Promise<(SupplierPrice & { material_id: string })[]> {
  const { data, error } = await untypedDb
    .from('supplier_material_prices')
    .select('*')
    .eq('supplier_id', supplierId)
    .eq('is_active', true)
    .order('material_id', { ascending: true });

  if (error) throw error;
  return data as (SupplierPrice & { material_id: string })[];
}

export async function upsertSupplierPrice(
  supplierId: string,
  priceData: {
    material_id: string;
    unit_price: number;
    uom: string;
    moq: number;
    lead_time_days: number;
  },
): Promise<void> {
  const { error } = await untypedDb.from('supplier_material_prices').upsert(
    {
      supplier_id: supplierId,
      material_id: priceData.material_id,
      unit_price: priceData.unit_price,
      uom: priceData.uom,
      moq: priceData.moq,
      lead_time_days: priceData.lead_time_days,
      valid_from: new Date().toISOString().split('T')[0],
    },
    { onConflict: 'supplier_id,material_id,valid_from' },
  );

  if (error) throw error;
}

export async function fetchSupplierCategories(): Promise<
  { code: string; name: string }[]
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('supplier_categories')
    .select('code, name')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any) || [];
}

export async function fetchSupplierStats(): Promise<{
  total: number;
  active: number;
}> {
  const { count: total, error: err1 } = await supabase
    .from('suppliers')
    .select('*', { count: 'exact', head: true });

  const { count: active, error: err2 } = await supabase
    .from('suppliers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  if (err1 || err2) throw err1 || err2;

  return { total: total ?? 0, active: active ?? 0 };
}
