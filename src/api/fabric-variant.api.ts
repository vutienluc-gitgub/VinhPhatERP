import type {
  FabricVariant,
  FabricVariantFilter,
} from '@/domain/settings/fabric-catalog.types';
import type { FabricVariantFormValues } from '@/schema/fabric-variant.schema';
import { untypedDb } from '@/services/supabase/client';
import { getTenantId } from '@/services/supabase/tenant';

const TABLE = 'fabric_variants';

/**
 * Fetch all variants for a given fabric catalog entry.
 */
export async function fetchFabricVariants(
  fabricCatalogId: string,
  filters: FabricVariantFilter = {},
): Promise<FabricVariant[]> {
  let query = untypedDb
    .from(TABLE)
    .select('*')
    .eq('fabric_catalog_id', fabricCatalogId)
    .order('variant_code', { ascending: true });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    query = query.or(
      `color_name.ilike.%${q}%,variant_code.ilike.%${q}%,sku.ilike.%${q}%,lot_number.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as FabricVariant[];
}

/**
 * Generate variant_code from parent fabric code + color name.
 * Example: FC-011 + "Đen" → FC-011-DEN
 */
function generateVariantCode(parentCode: string, colorName: string): string {
  const normalized = colorName
    .trim()
    .toUpperCase()
    // Normalize Vietnamese diacritics
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace đ/Đ
    .replace(/[đĐ]/g, 'D')
    // Replace spaces/special chars with hyphen
    .replace(/[^A-Z0-9]/g, '-')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Trim hyphens
    .replace(/^-|-$/g, '');

  return `${parentCode}-${normalized}`;
}

/**
 * Auto-calculate conversion rate: mét/kg = 1000 / (GSM * width_m)
 */
function calcConversionRate(
  actualGsm: number | null | undefined,
  actualWidthCm: number | null | undefined,
): number | null {
  if (!actualGsm || !actualWidthCm || actualGsm <= 0 || actualWidthCm <= 0) {
    return null;
  }
  const widthM = actualWidthCm / 100;
  return Math.round((1000 / (actualGsm * widthM)) * 1000) / 1000;
}

/**
 * Create a new fabric variant.
 */
export async function createFabricVariant(
  fabricCatalogId: string,
  parentCode: string,
  values: FabricVariantFormValues,
): Promise<FabricVariant> {
  const tenantId = await getTenantId();
  const variantCode = generateVariantCode(parentCode, values.color_name);
  const conversionRate =
    values.conversion_rate ??
    calcConversionRate(values.actual_gsm, values.actual_width_cm);

  const payload = {
    id: crypto.randomUUID(),
    fabric_catalog_id: fabricCatalogId,
    variant_code: variantCode,
    color_name: values.color_name.trim(),
    color_hex: values.color_hex?.trim() || null,
    actual_width_cm: values.actual_width_cm ?? null,
    actual_gsm: values.actual_gsm ?? null,
    shrinkage_rate_warp: values.shrinkage_rate_warp ?? 0,
    shrinkage_rate_weft: values.shrinkage_rate_weft ?? 0,
    base_uom: values.base_uom,
    conversion_rate: conversionRate,
    lot_number: values.lot_number?.trim() || null,
    supplier_id: values.supplier_id || null,
    sku: values.sku?.trim() || null,
    barcode: values.barcode?.trim() || null,
    moq: values.moq ?? null,
    purchase_price: values.purchase_price ?? null,
    selling_price: values.selling_price ?? null,
    status: values.status,
    image_url: values.image_url ?? null,
    notes: values.notes?.trim() || null,
    tenant_id: tenantId,
  };

  const { data, error } = await untypedDb
    .from(TABLE)
    .upsert(payload, { onConflict: 'id', ignoreDuplicates: false })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as FabricVariant;
}

/**
 * Update an existing fabric variant.
 */
export async function updateFabricVariant(
  id: string,
  parentCode: string,
  values: FabricVariantFormValues,
): Promise<FabricVariant> {
  const variantCode = generateVariantCode(parentCode, values.color_name);
  const conversionRate =
    values.conversion_rate ??
    calcConversionRate(values.actual_gsm, values.actual_width_cm);

  const payload = {
    variant_code: variantCode,
    color_name: values.color_name.trim(),
    color_hex: values.color_hex?.trim() || null,
    actual_width_cm: values.actual_width_cm ?? null,
    actual_gsm: values.actual_gsm ?? null,
    shrinkage_rate_warp: values.shrinkage_rate_warp ?? 0,
    shrinkage_rate_weft: values.shrinkage_rate_weft ?? 0,
    base_uom: values.base_uom,
    conversion_rate: conversionRate,
    lot_number: values.lot_number?.trim() || null,
    supplier_id: values.supplier_id || null,
    sku: values.sku?.trim() || null,
    barcode: values.barcode?.trim() || null,
    moq: values.moq ?? null,
    purchase_price: values.purchase_price ?? null,
    selling_price: values.selling_price ?? null,
    status: values.status,
    image_url: values.image_url ?? null,
    notes: values.notes?.trim() || null,
  };

  const { data, error } = await untypedDb
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as FabricVariant;
}

/**
 * Delete a fabric variant.
 */
export async function deleteFabricVariant(id: string): Promise<void> {
  const { error } = await untypedDb.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
}
