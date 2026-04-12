import type {
  RawFabricRoll,
  RawFabricRollInsert,
  RawFabricRollUpdate,
  RawFabricFilter,
} from '@/features/raw-fabric/types';
import { supabase } from '@/services/supabase/client';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';

const TABLE = 'raw_fabric_rolls';

export type SupplierOption = { id: string; code: string; name: string };
export type YarnReceiptOption = {
  id: string;
  receipt_number: string;
  receipt_date: string;
};
export type WorkOrderOption = {
  id: string;
  work_order_number: string;
  status: string;
  bom_template: { name: string } | null;
};
export type InventoryStats = {
  totalRolls: number;
  totalLengthM: number;
  totalWeightKg: number;
};

export async function fetchRawFabricPaginated(
  filters: RawFabricFilter = {},
  page = 1,
): Promise<PaginatedResult<RawFabricRoll>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  const sortCol = filters.sort_by ?? 'created_at';
  const sortAsc = filters.sort_dir === 'asc';

  let query = supabase
    .from(TABLE)
    .select('*', { count: 'exact' })
    .order(sortCol, { ascending: sortAsc })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.quality_grade)
    query = query.eq('quality_grade', filters.quality_grade);
  if (filters.fabric_type)
    query = query.ilike('fabric_type', `%${filters.fabric_type}%`);
  if (filters.roll_number)
    query = query.ilike('roll_number', `%${filters.roll_number}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? 0;
  return {
    data: (data ?? []) as RawFabricRoll[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  };
}

/** Fetch toàn bộ cuộn theo filter hiện tại — dùng cho export Excel/PDF */
export async function fetchRawFabricAll(
  filters: RawFabricFilter = {},
): Promise<RawFabricRoll[]> {
  let query = supabase
    .from(TABLE)
    .select('*')
    .order('roll_number', { ascending: true });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.quality_grade)
    query = query.eq('quality_grade', filters.quality_grade);
  if (filters.fabric_type)
    query = query.ilike('fabric_type', `%${filters.fabric_type}%`);
  if (filters.roll_number)
    query = query.ilike('roll_number', `%${filters.roll_number}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as RawFabricRoll[];
}

export async function createRawFabric(
  row: RawFabricRollInsert,
): Promise<RawFabricRoll> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([row])
    .select()
    .single();
  if (error) throw error;
  return data as RawFabricRoll;
}

export async function updateRawFabric(
  id: string,
  row: RawFabricRollUpdate,
): Promise<RawFabricRoll> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as RawFabricRoll;
}

export async function deleteRawFabric(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

export async function createRawFabricBulk(
  rows: RawFabricRollInsert[],
): Promise<RawFabricRoll[]> {
  // Check duplicates in DB
  const rollNumbers = rows.map((r) => r.roll_number);
  const { data: existing, error: existingErr } = await supabase
    .from(TABLE)
    .select('roll_number')
    .in('roll_number', rollNumbers);
  if (existingErr) throw existingErr;
  if ((existing ?? []).length > 0) {
    const taken = existing
      .map((r) => r.roll_number)
      .sort((a, b) => a.localeCompare(b));
    throw new Error(`Mã cuộn đã tồn tại: ${taken.join(', ')}`);
  }

  const { data, error } = await supabase.from(TABLE).insert(rows).select();
  if (error) throw error;
  return (data ?? []) as RawFabricRoll[];
}

export async function fetchWeavingPartners(): Promise<SupplierOption[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, code, name')
    .eq('category', 'weaving')
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return (data ?? []) as SupplierOption[];
}

export async function fetchYarnReceiptOptions(): Promise<YarnReceiptOption[]> {
  const { data, error } = await supabase
    .from('yarn_receipts')
    .select('id, receipt_number, receipt_date')
    .eq('status', 'confirmed')
    .order('receipt_date', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as YarnReceiptOption[];
}

export async function fetchWorkOrderOptions(): Promise<WorkOrderOption[]> {
  const { data, error } = await supabase
    .from('work_orders')
    .select('id, work_order_number, status, bom_template:bom_templates(name)')
    .in('status', ['in_progress', 'completed'])
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as WorkOrderOption[];
}

export async function fetchRawFabricStats(): Promise<InventoryStats> {
  const { data, error } = await supabase
    .from('v_raw_fabric_inventory')
    .select('roll_count, total_length_m, total_weight_kg');
  if (error) throw error;
  const rows = data ?? [];
  return {
    totalRolls: rows.reduce((s, r) => s + (r.roll_count ?? 0), 0),
    totalLengthM: rows.reduce((s, r) => s + (r.total_length_m ?? 0), 0),
    totalWeightKg: rows.reduce((s, r) => s + (r.total_weight_kg ?? 0), 0),
  };
}
