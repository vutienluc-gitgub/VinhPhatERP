import type {
  RawFabricRoll,
  RawFabricRollInsert,
  RawFabricRollUpdate,
  RawFabricFilter,
} from '@/features/raw-fabric/types';
import type {
  FinishedFabricRoll,
  FinishedFabricRollInsert,
  FinishedFabricRollUpdate,
} from '@/features/finished-fabric/types';
import { supabase } from '@/services/supabase/client';
import { getTenantId } from '@/services/supabase/tenant';

// ─── Vải mộc ───

const RAW_TABLE = 'raw_fabric_rolls';

export async function fetchRawFabricRolls(
  filters: RawFabricFilter = {},
): Promise<RawFabricRoll[]> {
  let query = supabase
    .from(RAW_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.quality_grade)
    query = query.eq('quality_grade', filters.quality_grade);
  if (filters.fabric_type) {
    query = query.ilike('fabric_type', `%${filters.fabric_type}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as RawFabricRoll[];
}

export async function createRawFabricRolls(
  rows: RawFabricRollInsert[],
): Promise<RawFabricRoll[]> {
  const tenantId = await getTenantId();
  const { data, error } = await supabase
    .from(RAW_TABLE)
    .insert(
      rows.map((r) => ({
        ...r,
        tenant_id: tenantId,
      })),
    )
    .select();
  if (error) throw error;
  return (data ?? []) as RawFabricRoll[];
}

export async function updateRawFabricRoll(
  id: string,
  row: RawFabricRollUpdate,
): Promise<RawFabricRoll> {
  const { data, error } = await supabase
    .from(RAW_TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as RawFabricRoll;
}

export async function deleteRawFabricRoll(id: string): Promise<void> {
  const { error } = await supabase.from(RAW_TABLE).delete().eq('id', id);
  if (error) throw error;
}

export async function checkDuplicateRollNumbers(
  rollNumbers: string[],
): Promise<string[]> {
  const { data, error } = await supabase
    .from(RAW_TABLE)
    .select('roll_number')
    .in('roll_number', rollNumbers);

  if (error) throw error;
  return (data ?? []).map((r) => r.roll_number);
}

// ─── Vải thành phẩm ───

const FINISHED_TABLE = 'finished_fabric_rolls';

export async function fetchFinishedFabricRolls(): Promise<
  FinishedFabricRoll[]
> {
  const { data, error } = await supabase
    .from(FINISHED_TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FinishedFabricRoll[];
}

export async function createFinishedFabricRoll(
  row: FinishedFabricRollInsert,
): Promise<FinishedFabricRoll> {
  const tenantId = await getTenantId();
  const { data, error } = await supabase
    .from(FINISHED_TABLE)
    .insert([
      {
        ...row,
        tenant_id: tenantId,
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data as FinishedFabricRoll;
}

export async function updateFinishedFabricRoll(
  id: string,
  row: FinishedFabricRollUpdate,
): Promise<FinishedFabricRoll> {
  const { data, error } = await supabase
    .from(FINISHED_TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as FinishedFabricRoll;
}
