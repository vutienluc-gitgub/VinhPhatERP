/**
 * Trading Stock API
 *
 * Fetch available inventory for trading orders:
 * - Yarn: by catalog + lot breakdown
 * - Raw fabric: individual rolls with status='in_stock'
 * - Finished fabric: individual rolls with status='in_stock'
 */
import { supabase } from '@/services/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TradingYarnStock {
  id: string;
  code: string;
  name: string;
  color_name: string | null;
  unit: string;
  total_stock_qty: number;
  reserved_qty: number;
  available_qty: number;
}

export interface TradingYarnLot {
  receipt_item_id: string;
  yarn_catalog_id: string;
  yarn_name: string;
  yarn_code: string;
  lot_number: string | null;
  receipt_number: string;
  receipt_date: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

export interface TradingFabricRoll {
  id: string;
  roll_number: string;
  fabric_type: string;
  color_name: string | null;
  color_code: string | null;
  width_cm: number | null;
  length_m: number | null;
  weight_kg: number | null;
  quality_grade: string | null;
  warehouse_location: string | null;
  lot_number: string | null;
  status: string;
}

// ─── Yarn ─────────────────────────────────────────────────────────────────────

/**
 * Fetch yarn availability summary (by catalog item).
 * Reuses v_yarn_availability view.
 */
export async function fetchTradingYarnStock(): Promise<TradingYarnStock[]> {
  const { data, error } = await supabase
    .from('v_yarn_availability')
    .select('*')
    .gt('available_qty', 0)
    .order('code', { ascending: true });

  if (error) throw error;
  return (data ?? []) as TradingYarnStock[];
}

/**
 * Fetch yarn lots (from confirmed receipts) for a specific yarn catalog item.
 * Enables lot-level tracking when selling yarn.
 */
export async function fetchTradingYarnLots(
  yarnCatalogId: string,
): Promise<TradingYarnLot[]> {
  const { data, error } = await supabase
    .from('yarn_receipt_items')
    .select(
      `
      id,
      yarn_catalog_id,
      lot_number,
      quantity,
      unit,
      unit_price,
      landed_price,
      yarn_receipts!inner(receipt_number, receipt_date, status)
    `,
    )
    .eq('yarn_catalog_id', yarnCatalogId)
    .eq('yarn_receipts.status', 'confirmed')
    .gt('quantity', 0)
    .order('lot_number', { ascending: true });

  if (error) throw error;

  // Also fetch yarn catalog info
  const { data: catalog } = await supabase
    .from('yarn_catalogs')
    .select('name, code')
    .eq('id', yarnCatalogId)
    .single();

  return (data ?? []).map((item) => {
    const receipt = item.yarn_receipts as unknown as {
      receipt_number: string;
      receipt_date: string;
    };
    return {
      receipt_item_id: item.id,
      yarn_catalog_id: item.yarn_catalog_id ?? yarnCatalogId,
      yarn_name: catalog?.name ?? '',
      yarn_code: catalog?.code ?? '',
      lot_number: item.lot_number,
      receipt_number: receipt.receipt_number,
      receipt_date: receipt.receipt_date,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.landed_price > 0 ? item.landed_price : item.unit_price,
    };
  });
}

// ─── Raw Fabric Rolls ─────────────────────────────────────────────────────────

/**
 * Fetch raw fabric rolls available for trading (in_stock, not reserved).
 */
export async function fetchTradingRawFabricRolls(): Promise<
  TradingFabricRoll[]
> {
  const { data, error } = await supabase
    .from('raw_fabric_rolls')
    .select(
      'id, roll_number, fabric_type, color_name, color_code, width_cm, length_m, weight_kg, quality_grade, warehouse_location, lot_number, status',
    )
    .eq('status', 'in_stock')
    .order('roll_number', { ascending: true })
    .limit(500);

  if (error) throw error;
  return (data ?? []) as TradingFabricRoll[];
}

// ─── Finished Fabric Rolls ────────────────────────────────────────────────────

/**
 * Fetch finished fabric rolls available for trading (in_stock, not reserved).
 */
export async function fetchTradingFinishedFabricRolls(): Promise<
  TradingFabricRoll[]
> {
  const { data, error } = await supabase
    .from('finished_fabric_rolls')
    .select(
      'id, roll_number, fabric_type, color_name, color_code, width_cm, length_m, weight_kg, quality_grade, warehouse_location, status',
    )
    .eq('status', 'in_stock')
    .is('reserved_for_order_id', null)
    .order('roll_number', { ascending: true })
    .limit(500);

  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    lot_number: null,
  })) as TradingFabricRoll[];
}
