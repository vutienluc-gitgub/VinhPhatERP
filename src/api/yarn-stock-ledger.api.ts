/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/services/supabase/client';

export interface YarnReceiptHistoryRow {
  id: string;
  receipt_date: string;
  receipt_number: string;
  po_number: string | null;
  supplier_name: string | null;
  quantity: number;
  unit: string;
  notes: string | null;
}

export interface YarnAdjustmentHistoryRow {
  id: string;
  created_at: string;
  adjustment_type: string;
  adjustment_qty: number;
  reason: string;
  notes: string | null;
  created_by: string | null;
}

/**
 * Fetch incoming receipts for a specific yarn catalog item.
 */
export async function fetchYarnReceiptHistory(
  yarnCatalogId: string,
): Promise<YarnReceiptHistoryRow[]> {
  const { data, error } = await supabase
    .from('yarn_receipt_items')
    .select(
      `
      id,
      quantity,
      unit,
      notes,
      yarn_receipts!inner (
        receipt_date,
        receipt_number,
        suppliers (name)
      )
    `,
    )
    .eq('yarn_catalog_id', yarnCatalogId);

  if (error) throw error;

  const rows = ((data as any[]) || []).map((row) => {
    const receipt = Array.isArray(row.yarn_receipts)
      ? row.yarn_receipts[0]
      : row.yarn_receipts;
    return {
      id: row.id,
      receipt_date: receipt?.receipt_date,
      receipt_number: receipt?.receipt_number,
      po_number: null, // PO not linked directly in DB
      supplier_name: receipt?.suppliers?.name || null,
      quantity: row.quantity,
      unit: row.unit,
      notes: row.notes,
    };
  });

  // Sort descending by receipt_date in memory
  return rows.sort(
    (a, b) =>
      new Date(b.receipt_date).getTime() - new Date(a.receipt_date).getTime(),
  );
}

/**
 * Fetch adjustments and other stock movements.
 */
export async function fetchYarnAdjustmentHistory(
  yarnCatalogId: string,
): Promise<YarnAdjustmentHistoryRow[]> {
  const { data, error } = await supabase
    .from('inventory_adjustments')
    .select('*')
    .eq('reference_id', yarnCatalogId)
    .eq('item_type', 'yarn')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data as any[]) || []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    adjustment_type: row.adjustment_type,
    adjustment_qty: row.adjustment_qty,
    reason: row.reason,
    notes: row.notes,
    created_by: row.created_by,
  }));
}
