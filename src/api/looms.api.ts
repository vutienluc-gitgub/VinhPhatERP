import type { LoomWithSupplier, LoomFilter } from '@/features/looms/types';
import { untypedDb } from '@/services/supabase/client';
import { getTenantId } from '@/services/supabase/tenant';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';
import { validateApiInput } from '@/lib/validate-api-input';
import { apiLoomInsert } from '@/schema/api-validation.schema';
import { safeUpsertOne } from '@/lib/db-guard';

const TABLE = 'looms';

type LoomInsertRow = {
  tenant_id: string;
  code: string;
  name: string;
  loom_type: string;
  supplier_id: string;
  max_width_cm: number | null;
  max_speed_rpm: number | null;
  daily_capacity_m: number | null;
  year_manufactured: number | null;
  status: string;
  notes: string | null;
};

/* ── List (paginated) ── */

export async function fetchLoomsPaginated(
  filters: LoomFilter = {},
  page = 1,
): Promise<PaginatedResult<LoomWithSupplier>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = untypedDb
    .from(TABLE)
    .select('*, supplier:suppliers(id, code, name)', { count: 'exact' })
    .order('code', { ascending: true })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.supplier_id) query = query.eq('supplier_id', filters.supplier_id);
  if (filters.loom_type) query = query.eq('loom_type', filters.loom_type);
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? 0;
  return {
    data: (data ?? []) as unknown as LoomWithSupplier[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  };
}

/* ── Options (for dropdowns) ── */

export async function fetchLoomOptions(): Promise<
  { id: string; code: string; name: string; supplier_id: string }[]
> {
  const { data, error } = await untypedDb
    .from(TABLE)
    .select('id, code, name, supplier_id')
    .eq('status', 'active')
    .order('code');
  if (error) throw error;
  return (data ?? []) as {
    id: string;
    code: string;
    name: string;
    supplier_id: string;
  }[];
}

/* ── Next code ── */

export async function fetchNextLoomCode(): Promise<string> {
  const { data, error } = await untypedDb
    .from(TABLE)
    .select('code')
    .ilike('code', 'LOOM-%')
    .order('code', { ascending: false })
    .limit(1);

  if (error) return 'LOOM-001';
  if (!data || data.length === 0) return 'LOOM-001';
  const last = (data[0] as { code: string })?.code ?? 'LOOM-000';
  const match = last.match(/^LOOM-(\d+)$/);
  if (!match?.[1]) return 'LOOM-001';
  const nextNum = parseInt(match[1], 10) + 1;
  return `LOOM-${String(nextNum).padStart(3, '0')}`;
}

/* ── Create ── */

export async function createLoom(
  row: Omit<LoomInsertRow, 'tenant_id'>,
): Promise<LoomWithSupplier> {
  validateApiInput(apiLoomInsert.passthrough(), row);
  const tenantId = await getTenantId();
  const id = crypto.randomUUID();
  await safeUpsertOne({
    table: 'looms',
    data: { id, ...row, tenant_id: tenantId },
    conflictKey: 'id',
  });
  // Re-fetch with supplier join
  const { data, error } = await untypedDb
    .from(TABLE)
    .select('*, supplier:suppliers(id, code, name)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as LoomWithSupplier;
}

/* ── Update ── */

export async function updateLoom(
  id: string,
  row: Omit<LoomInsertRow, 'tenant_id'>,
): Promise<LoomWithSupplier> {
  const { data, error } = await untypedDb
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select('*, supplier:suppliers(id, code, name)')
    .single();
  if (error) throw error;
  return data as unknown as LoomWithSupplier;
}

/* ── Delete ── */

export async function deleteLoom(id: string): Promise<void> {
  const { error } = await untypedDb.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
