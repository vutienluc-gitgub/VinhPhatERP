/**
 * InventoryDomain — business logic cho ton kho.
 * Bounded Context: Inventory (raw-fabric, finished-fabric, yarn-receipts)
 *
 * Pure TypeScript, khong phu thuoc React hay Supabase.
 *
 * Noi dung:
 * - Roll data mapping (form → DB payload)
 * - Bulk import mapping
 * - Barcode generation
 * - Duplicate detection
 * - Stock calculations
 */

// ─── Barcode ──────────────────────────────────────────────────────────────────

/**
 * Generate barcode tu roll number.
 * Shared giua raw-fabric va finished-fabric.
 */
export function generateBarcode(rollNumber: string): string {
  return `VP-${rollNumber.replace(/[^a-zA-Z0-9]/g, '')}`;
}

// ─── Duplicate Detection ──────────────────────────────────────────────────────

/**
 * Tim ma cuon bi trung trong 1 lo nhap.
 * Shared giua raw-fabric va finished-fabric bulk import.
 */
export function findDuplicateRollNumbers(
  rolls: Array<{ roll_number: string }>,
): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const roll of rolls) {
    const num = roll.roll_number.trim();
    if (seen.has(num)) {
      duplicates.push(num);
    } else {
      seen.add(num);
    }
  }

  return duplicates;
}

// ─── Raw Fabric Mapping ───────────────────────────────────────────────────────

export interface RawFabricDbRow<S = string, Q = string> {
  roll_number: string;
  fabric_type: string;
  yarn_receipt_id: string | null;
  weaving_partner_id: string | null;
  color_name: string | null;
  color_code: string | null;
  width_cm: number | null;
  length_m: number | null;
  weight_kg: number | null;
  quality_grade: Q | null;
  status: S;
  warehouse_location: string | null;
  production_date: string | null;
  notes: string | null;
  lot_number: string | null;
  barcode: string;
  work_order_id: string | null;
}

/**
 * Map form values sang DB row cho raw fabric.
 * Logic nay truoc day nam trong useRawFabric.ts dong 31-53.
 */
export function mapRawFabricFormToDb<
  S extends string,
  Q extends string = string,
>(values: {
  roll_number: string;
  fabric_type: string;
  yarn_receipt_id?: string;
  weaving_partner_id?: string;
  color_name?: string;
  color_code?: string;
  width_cm?: number | null;
  length_m?: number | null;
  weight_kg?: number | null;
  quality_grade?: Q | null;
  status: S;
  warehouse_location?: string;
  production_date?: string;
  notes?: string;
  lot_number?: string;
  work_order_id?: string;
}): RawFabricDbRow<S, Q> {
  return {
    roll_number: values.roll_number,
    fabric_type: values.fabric_type,
    yarn_receipt_id: values.yarn_receipt_id?.trim() || null,
    weaving_partner_id: values.weaving_partner_id?.trim() || null,
    color_name: values.color_name?.trim() || null,
    color_code: values.color_code?.trim() || null,
    width_cm: values.width_cm ?? null,
    length_m: values.length_m ?? null,
    weight_kg: values.weight_kg ?? null,
    quality_grade: values.quality_grade ?? null,
    status: values.status,
    warehouse_location: values.warehouse_location?.trim() || null,
    production_date: values.production_date?.trim() || null,
    notes: values.notes?.trim() || null,
    lot_number: values.lot_number?.trim() || null,
    barcode: generateBarcode(values.roll_number),
    work_order_id: values.work_order_id?.trim() || null,
  };
}

/**
 * Map bulk import rows sang DB rows.
 * Logic nay truoc day nam trong useRawFabric.ts dong 123-141.
 */
export function mapRawFabricBulkToDb<
  S extends string,
  Q extends string = string,
>(
  shared: {
    fabric_type: string;
    yarn_receipt_id?: string;
    weaving_partner_id?: string;
    color_name?: string;
    color_code?: string;
    width_cm?: number | null;
    quality_grade?: Q | null;
    status: S;
    warehouse_location?: string;
    production_date?: string;
    lot_number?: string;
    work_order_id?: string;
  },
  rolls: Array<{
    roll_number: string;
    length_m?: number | null;
    weight_kg?: number | null;
    quality_grade?: Q | null;
    notes?: string;
  }>,
): RawFabricDbRow<S, Q>[] {
  return rolls.map((row) => ({
    roll_number: row.roll_number.trim(),
    fabric_type: shared.fabric_type,
    yarn_receipt_id: shared.yarn_receipt_id?.trim() || null,
    weaving_partner_id: shared.weaving_partner_id?.trim() || null,
    color_name: shared.color_name?.trim() || null,
    color_code: shared.color_code?.trim() || null,
    width_cm: shared.width_cm ?? null,
    length_m: row.length_m ?? null,
    weight_kg: row.weight_kg ?? null,
    quality_grade: row.quality_grade ?? shared.quality_grade ?? null,
    status: shared.status,
    warehouse_location: shared.warehouse_location?.trim() || null,
    production_date: shared.production_date?.trim() || null,
    notes: row.notes?.trim() || null,
    lot_number: shared.lot_number?.trim() || null,
    barcode: generateBarcode(row.roll_number.trim()),
    work_order_id: shared.work_order_id?.trim() || null,
  }));
}

// ─── Finished Fabric Mapping ──────────────────────────────────────────────────

export interface FinishedFabricDbRow<S = string, Q = string> {
  roll_number: string;
  raw_roll_id: string;
  fabric_type: string;
  color_name: string | null;
  color_code: string | null;
  width_cm: number | null;
  length_m: number | null;
  weight_kg: number | null;
  quality_grade: Q | null;
  status: S;
  warehouse_location: string | null;
  production_date: string | null;
  reserved_for_order_id: string | null;
  notes: string | null;
}

/**
 * Map form values sang DB row cho finished fabric.
 * Logic nay truoc day nam trong useFinishedFabric.ts dong 31-49.
 */
export function mapFinishedFabricFormToDb<
  S extends string,
  Q extends string = string,
>(values: {
  roll_number: string;
  raw_roll_id: string;
  fabric_type: string;
  color_name?: string;
  color_code?: string;
  width_cm?: number | null;
  length_m?: number | null;
  weight_kg?: number | null;
  quality_grade?: Q | null;
  status: S;
  warehouse_location?: string;
  production_date?: string;
  reserved_for_order_id?: string | null;
  notes?: string;
}): FinishedFabricDbRow<S, Q> {
  return {
    roll_number: values.roll_number,
    raw_roll_id: values.raw_roll_id,
    fabric_type: values.fabric_type,
    color_name: values.color_name?.trim() || null,
    color_code: values.color_code?.trim() || null,
    width_cm: values.width_cm ?? null,
    length_m: values.length_m ?? null,
    weight_kg: values.weight_kg ?? null,
    quality_grade: values.quality_grade ?? null,
    status: values.status,
    warehouse_location: values.warehouse_location?.trim() || null,
    production_date: values.production_date?.trim() || null,
    reserved_for_order_id: values.reserved_for_order_id ?? null,
    notes: values.notes?.trim() || null,
  };
}

// ─── Stock Calculations ───────────────────────────────────────────────────────

/**
 * Tinh tong trong luong kho (kg).
 */
export function calculateTotalWeightKg(
  rolls: Array<{ weight_kg: number | null }>,
): number {
  return rolls.reduce((sum, r) => sum + (r.weight_kg ?? 0), 0);
}

/**
 * Tinh tong chieu dai kho (m).
 */
export function calculateTotalLengthM(
  rolls: Array<{ length_m: number | null }>,
): number {
  return rolls.reduce((sum, r) => sum + (r.length_m ?? 0), 0);
}

/**
 * Dem so cuon theo trang thai.
 */
export function countRollsByStatus(
  rolls: Array<{ status: string }>,
): Record<string, number> {
  return rolls.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
}
