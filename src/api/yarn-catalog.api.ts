import type {
  YarnCatalog,
  YarnCatalogFilter,
} from '@/features/yarn-catalog/types';
import { supabase } from '@/services/supabase/client';
import { safeUpsertOne } from '@/lib/db-guard';
import { getTenantId } from '@/services/supabase/tenant';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';

const TABLE = 'yarn_catalogs';

type YarnCatalogRow = Omit<YarnCatalog, 'id' | 'created_at' | 'updated_at'>;

export async function fetchYarnCatalogPaginated(
  filters: YarnCatalogFilter = {},
  page = 1,
): Promise<PaginatedResult<YarnCatalog>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from(TABLE)
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    query = query.or(
      `name.ilike.%${q}%,code.ilike.%${q}%,composition.ilike.%${q}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? 0;
  return {
    data: (data ?? []) as YarnCatalog[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  };
}

export async function fetchYarnCatalogOptions(): Promise<
  Pick<
    YarnCatalog,
    | 'id'
    | 'code'
    | 'name'
    | 'composition'
    | 'color_name'
    | 'tensile_strength'
    | 'origin'
    | 'unit'
  >[]
> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      'id, code, name, composition, color_name, tensile_strength, origin, lot_no, grade, unit',
    )
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return (data ?? []) as Pick<
    YarnCatalog,
    | 'id'
    | 'code'
    | 'name'
    | 'composition'
    | 'color_name'
    | 'tensile_strength'
    | 'origin'
    | 'unit'
  >[];
}

export async function fetchNextYarnCatalogCode(): Promise<string> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('code')
    .ilike('code', 'YS-%')
    .order('code', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return 'YS-001';
  const last = data[0]?.code ?? 'YS-000';
  const match = last.match(/^YS-(\d+)$/);
  if (!match) return 'YS-001';
  const nextNum = parseInt(match[1]!, 10) + 1;
  return `YS-${String(nextNum).padStart(3, '0')}`;
}

export async function createYarnCatalog(
  row: YarnCatalogRow,
): Promise<YarnCatalog> {
  const tenantId = await getTenantId();

  // Application-level duplicate check on code
  const { data: existing } = await supabase
    .from(TABLE)
    .select('id')
    .eq('code', row.code)
    .maybeSingle();
  if (existing) {
    throw new Error(`Mã sợi "${row.code}" đã tồn tại. Vui lòng chọn mã khác.`);
  }

  const inserted = await safeUpsertOne({
    table: TABLE,
    data: {
      ...row,
      tenant_id: tenantId,
    },
    conflictKey: 'id',
  });
  return inserted as unknown as YarnCatalog;
}

export async function updateYarnCatalog(
  id: string,
  row: YarnCatalogRow,
): Promise<YarnCatalog> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as YarnCatalog;
}

export async function deleteYarnCatalog(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
