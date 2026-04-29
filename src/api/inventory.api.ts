import type {
  InventoryAdjustment,
  InventoryAdjustmentInsert,
} from '@/features/inventory/types';
import { supabase } from '@/services/supabase/client';
import { getTenantId } from '@/services/supabase/tenant';
import { safeUpsertOne } from '@/lib/db-guard';

const TABLE = 'inventory_adjustments';

export type InventoryStats = {
  totalRolls: number;
  totalLengthM: number;
  totalWeightKg: number;
};

export type InventoryBreakdownRow = {
  fabric_type: string | null;
  color_name: string | null;
  quality_grade: string | null;
  roll_count: number | null;
  total_length_m: number | null;
  total_weight_kg: number | null;
};

export type AgingRoll = {
  id: string;
  roll_number: string;
  fabric_type: string;
  color_name: string | null;
  warehouse_location: string | null;
  status: string;
  age_days: number;
  source: 'raw' | 'finished';
};

const AGING_THRESHOLD_DAYS = 30;

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export async function fetchInventoryAdjustments(): Promise<
  InventoryAdjustment[]
> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as InventoryAdjustment[];
}

export async function createInventoryAdjustment(
  row: InventoryAdjustmentInsert,
): Promise<InventoryAdjustment> {
  const tenantId = await getTenantId();
  const inserted = await safeUpsertOne({
    table: TABLE,
    data: {
      ...row,
      tenant_id: tenantId,
    },
    conflictKey: 'id',
  });
  return inserted as unknown as InventoryAdjustment;
}

export async function fetchRawFabricInventory(): Promise<{
  stats: InventoryStats;
  breakdown: InventoryBreakdownRow[];
}> {
  const { data, error } = await supabase
    .from('v_raw_fabric_inventory')
    .select(
      'fabric_type, color_name, quality_grade, roll_count, total_length_m, total_weight_kg',
    );
  if (error) throw error;
  const rows = (data ?? []) as InventoryBreakdownRow[];
  return {
    stats: {
      totalRolls: rows.reduce((s, r) => s + (r.roll_count ?? 0), 0),
      totalLengthM: rows.reduce((s, r) => s + (r.total_length_m ?? 0), 0),
      totalWeightKg: rows.reduce((s, r) => s + (r.total_weight_kg ?? 0), 0),
    },
    breakdown: rows,
  };
}

export async function fetchFinishedFabricInventory(): Promise<{
  stats: InventoryStats;
  breakdown: InventoryBreakdownRow[];
}> {
  const { data, error } = await supabase
    .from('v_finished_fabric_inventory')
    .select(
      'fabric_type, color_name, quality_grade, roll_count, total_length_m, total_weight_kg',
    );
  if (error) throw error;
  const rows = (data ?? []) as InventoryBreakdownRow[];
  return {
    stats: {
      totalRolls: rows.reduce((s, r) => s + (r.roll_count ?? 0), 0),
      totalLengthM: rows.reduce((s, r) => s + (r.total_length_m ?? 0), 0),
      totalWeightKg: rows.reduce((s, r) => s + (r.total_weight_kg ?? 0), 0),
    },
    breakdown: rows,
  };
}

export async function fetchYarnInventory(): Promise<{
  totalReceipts: number;
  totalAmount: number;
}> {
  const { data, error } = await supabase
    .from('yarn_receipts')
    .select('id, total_amount, status')
    .eq('status', 'confirmed');
  if (error) throw error;
  const rows = data ?? [];
  return {
    totalReceipts: rows.length,
    totalAmount: rows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0),
  };
}

export async function fetchAgingStock(): Promise<AgingRoll[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - AGING_THRESHOLD_DAYS);
  const cutoffIso = cutoff.toISOString();

  const [
    { data: rawData, error: rawErr },
    { data: finishedData, error: finishedErr },
  ] = await Promise.all([
    supabase
      .from('raw_fabric_rolls')
      .select(
        'id, roll_number, fabric_type, color_name, warehouse_location, status, created_at, production_date',
      )
      .eq('status', 'in_stock')
      .lt('created_at', cutoffIso)
      .order('created_at', { ascending: true })
      .limit(100),
    supabase
      .from('finished_fabric_rolls')
      .select(
        'id, roll_number, fabric_type, color_name, warehouse_location, status, created_at, production_date',
      )
      .eq('status', 'in_stock')
      .lt('created_at', cutoffIso)
      .order('created_at', { ascending: true })
      .limit(100),
  ]);

  if (rawErr) throw rawErr;
  if (finishedErr) throw finishedErr;

  const toAgingRoll = (
    row: Record<string, unknown>,
    source: 'raw' | 'finished',
  ): AgingRoll => ({
    id: row.id as string,
    roll_number: row.roll_number as string,
    fabric_type: row.fabric_type as string,
    color_name: row.color_name as string | null,
    warehouse_location: row.warehouse_location as string | null,
    status: row.status as string,
    age_days: daysSince(
      (row.production_date as string) ?? (row.created_at as string),
    ),
    source,
  });

  return [
    ...(rawData ?? []).map((r) =>
      toAgingRoll(r as Record<string, unknown>, 'raw'),
    ),
    ...(finishedData ?? []).map((r) =>
      toAgingRoll(r as Record<string, unknown>, 'finished'),
    ),
  ].sort((a, b) => b.age_days - a.age_days);
}
