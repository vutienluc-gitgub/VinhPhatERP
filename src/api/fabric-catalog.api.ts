import type {
  FabricCatalog,
  FabricCatalogFilter,
} from '@/domain/settings/fabric-catalog.types';
import { supabase, untypedDb } from '@/services/supabase/client';
import { getTenantId } from '@/services/supabase/tenant';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';
import { safeUpsertOne } from '@/lib/db-guard';

const TABLE = 'fabric_catalogs';

type FabricCatalogRow = Omit<FabricCatalog, 'id' | 'created_at' | 'updated_at'>;

const CATEGORY_SELECT = '*, fabric_categories(id, code, name, color_hint)';

/** Transform Supabase joined row: rename fabric_categories -> category */
function transformCategoryRow(row: Record<string, unknown>): FabricCatalog {
  const category = row.fabric_categories;
  delete row.fabric_categories;
  return { ...row, category } as unknown as FabricCatalog;
}

export async function fetchFabricCatalogPaginated(
  filters: FabricCatalogFilter = {},
  page = 1,
): Promise<PaginatedResult<FabricCatalog>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = untypedDb
    .from(TABLE)
    .select(CATEGORY_SELECT, {
      count: 'exact',
    })
    .order('name', { ascending: true })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.category_id) query = query.eq('category_id', filters.category_id);
  if (filters.composition?.trim()) {
    query = query.ilike('composition', `%${filters.composition.trim()}%`);
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? 0;

  // Transform fabric_categories -> category
  const transformedData = (data ?? []).map((row: Record<string, unknown>) =>
    transformCategoryRow(row),
  );

  return {
    data: transformedData,
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  };
}

export async function fetchFabricCatalogOptions(): Promise<
  Pick<FabricCatalog, 'id' | 'code' | 'name' | 'composition' | 'unit'>[]
> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, code, name, composition, unit')
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return (data ?? []) as Pick<
    FabricCatalog,
    'id' | 'code' | 'name' | 'composition' | 'unit'
  >[];
}

export async function fetchNextFabricCatalogCode(): Promise<string> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('code')
    .ilike('code', 'FC-%')
    .order('code', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return 'FC-001';
  const last = data[0]?.code ?? 'FC-000';
  const match = last.match(/^FC-(\d+)$/);
  if (!match) return 'FC-001';
  const nextNum = parseInt(match[1]!, 10) + 1;
  return `FC-${String(nextNum).padStart(3, '0')}`;
}

export async function createFabricCatalog(
  row: FabricCatalogRow,
): Promise<FabricCatalog> {
  const tenantId = await getTenantId();
  const inserted = await safeUpsertOne({
    table: TABLE,
    data: {
      ...row,
      tenant_id: tenantId,
    },
    conflictKey: 'id',
  });
  return inserted as unknown as FabricCatalog;
}

export async function updateFabricCatalog(
  id: string,
  row: FabricCatalogRow,
): Promise<FabricCatalog> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(row as Record<string, unknown>)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FabricCatalog;
}

export async function deleteFabricCatalog(id: string): Promise<void> {
  // TODO: After running `supabase db push` for migration 20260512000001,
  // switch to: untypedDb.rpc('rpc_delete_fabric_catalog', { p_fabric_id: id })
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchFabricCatalogByIdOrCode(
  identifier: string,
): Promise<FabricCatalog> {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier,
    );

  let query = untypedDb.from(TABLE).select(CATEGORY_SELECT);

  if (isUuid) {
    query = query.eq('id', identifier);
  } else {
    query = query.eq('code', identifier);
  }

  const { data, error } = await query.single();
  if (error) throw error;

  return transformCategoryRow(data as Record<string, unknown>);
}

export async function fetchFabricCategories(): Promise<
  { id: string; name: string; code: string; color_hint?: string }[]
> {
  const { data, error } = await untypedDb
    .from('fabric_categories')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as {
    id: string;
    name: string;
    code: string;
    color_hint?: string;
  }[];
}

export async function fetchPublicFabricBySlug(
  slug: string,
): Promise<Partial<FabricCatalog>> {
  const { data, error } = await untypedDb.rpc('rpc_get_public_fabric', {
    p_slug: slug,
  });
  if (error) throw error;
  if (!data) throw new Error('Không tìm thấy thông tin công khai.');
  return data as Partial<FabricCatalog>;
}
