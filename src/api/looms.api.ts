import type {
  LoomWithSupplier,
  LoomFilter,
} from '@/domain/settings/looms.types';
import { supabase } from '@/services/supabase/client';
import { getTenantId } from '@/services/supabase/tenant';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';
import { validateApiInput } from '@/lib/validate-api-input';
import { apiLoomInsert } from '@/schema/api-validation.schema';
import { safeUpsertOne } from '@/lib/db-guard';
import { assertSingleMutation } from '@/lib/db-mutation-guard';

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
  daily_capacity_kg: number | null;
  year_manufactured: number | null;
  diameter_inch?: number | null;
  gauge?: number | null;
  feeders?: number | null;
  needles?: number | null;
  gsm_range?: string | null;
  yarn_support?: string | null;
  motor_power_kw?: number | null;
  voltage?: string | null;
  weight_kg?: number | null;
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

  let query = supabase
    .from(TABLE)
    .select(
      '*, supplier:suppliers(id, code, name), production_state:loom_production_states(efficiency_pct, current_work_order:work_orders(work_order_number, order:orders(order_number)))',
      { count: 'exact' },
    )
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
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, code, name, supplier_id')
    .in('status', ['running', 'idle', 'setup'])
    .order('code');
  if (error) throw error;
  return (data ?? []) as {
    id: string;
    code: string;
    name: string;
    supplier_id: string;
  }[];
}

/* ── Smart code prefix mapping ── */

const LOOM_TYPE_PREFIX: Record<string, string> = {
  single_jersey: 'SJ',
  double_jersey: 'DJ',
  rib: 'RB',
  interlock: 'IL',
  terry: 'TR',
  jacquard: 'JQ',
  open_width: 'OW',
  flat_knitting: 'FK',
  warp_knitting: 'WK',
  rapier: 'RP',
  air_jet: 'AJ',
  water_jet: 'WJ',
  shuttle: 'ST',
  accessories: 'ACC',
  other: 'OT',
};

/**
 * Build a smart code prefix from loom specs.
 * Examples:
 *   SJ-32-28G  (Single Jersey, 32", 28 gauge)
 *   DJ-30-24G  (Double Jersey, 30", 24 gauge)
 *   RP         (Rapier - no diameter/gauge)
 */
export function buildLoomCodePrefix(
  loomType: string,
  diameterInch?: number | null,
  gauge?: number | null,
): string {
  const typePrefix = LOOM_TYPE_PREFIX[loomType] ?? 'OT';
  const parts = [typePrefix];
  if (diameterInch) parts.push(String(Math.round(diameterInch)));
  if (gauge) parts.push(`${gauge}G`);
  return parts.join('-');
}

/* ── Next code ── */

export async function fetchNextLoomCode(prefix?: string): Promise<string> {
  const codePrefix = prefix || 'LOOM';
  const searchPattern = `${codePrefix}-%`;

  const { data, error } = await supabase
    .from(TABLE)
    .select('code')
    .ilike('code', searchPattern)
    .order('code', { ascending: false })
    .limit(1);

  const fallback = `${codePrefix}-001`;
  if (error) return fallback;
  if (!data || data.length === 0) return fallback;

  const last = (data[0] as { code: string })?.code ?? '';
  // Extract trailing number sequence (e.g. "SJ-32-28G-003" → "003")
  const match = last.match(/-(\d+)$/);
  if (!match?.[1]) return fallback;

  const nextNum = parseInt(match[1], 10) + 1;
  return `${codePrefix}-${String(nextNum).padStart(3, '0')}`;
}

/* ── Create ── */

export async function createLoom(
  row: Omit<LoomInsertRow, 'tenant_id'> & { id?: string },
): Promise<LoomWithSupplier> {
  validateApiInput(apiLoomInsert.passthrough(), row);
  const tenantId = await getTenantId();
  const id = row.id || crypto.randomUUID();
  await safeUpsertOne({
    table: 'looms',
    data: { ...row, id, tenant_id: tenantId },
    conflictKey: 'id',
  });
  // Re-fetch with supplier join
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      '*, supplier:suppliers(id, code, name), production_state:loom_production_states(efficiency_pct, current_work_order:work_orders(work_order_number, order:orders(order_number)))',
    )
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as LoomWithSupplier;
}
/* ── Update ── */

export async function updateLoom(
  id: string,
  row: Omit<LoomInsertRow, 'tenant_id'>,
  expectedUpdatedAt?: string,
): Promise<LoomWithSupplier> {
  let query = supabase.from(TABLE).update(row).eq('id', id);

  if (expectedUpdatedAt) {
    query = query.eq('updated_at', expectedUpdatedAt);
  }

  const { data, error } = await query
    .select(
      '*, supplier:suppliers(id, code, name), production_state:loom_production_states(efficiency_pct, current_work_order:work_orders(work_order_number, order:orders(order_number)))',
    )
    .single();

  return assertSingleMutation(data, error, {
    entityName: 'Máy dệt',
    expectedUpdatedAt,
    transitionName: 'cập nhật máy dệt',
  }) as unknown as LoomWithSupplier;
}

/* ── Delete ── */

export async function deleteLoom(
  id: string,
  expectedUpdatedAt?: string,
): Promise<void> {
  let query = supabase.from(TABLE).delete().eq('id', id);

  if (expectedUpdatedAt) {
    query = query.eq('updated_at', expectedUpdatedAt);
  }

  const { data, error } = await query.select().single();
  assertSingleMutation(data, error, {
    entityName: 'Máy dệt',
    expectedUpdatedAt,
    transitionName: 'xóa máy dệt',
  });
}
