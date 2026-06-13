/**
 * Fabric-catalog domain types.
 * Pure TypeScript — no React or Supabase dependency.
 */
export type FabricCatalogStatus = 'active' | 'inactive';

export type FabricCatalog = {
  id: string;
  code: string;
  name: string;
  composition: string | null;
  composition_tags: string[] | null;
  target_width_cm: number | null;
  target_gsm: number | null;
  unit: string;
  notes: string | null;
  category_id: string | null;
  category?: {
    id: string;
    code: string;
    name: string;
    color_hint: string | null;
  } | null;
  status: FabricCatalogStatus;
  image_url: string | null;
  fabric_type: 'knitted' | 'woven';
  gauge: number | null;
  diameter: number | null;
  machine_type: string | null;
  needle_count: number | null;
  warp_count: string | null;
  weft_count: string | null;
  epi: number | null;
  ppi: number | null;
  weave_pattern: string | null;
  color: string | null;
  color_tags: string[] | null;
  technique: string | null;
  specifications: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  slug: string;
};

export type FabricCatalogFilter = {
  search?: string;
  category_id?: string;
  composition?: string;
  status?: FabricCatalogStatus;
};

/* ─── Fabric Variant (Child of FabricCatalog) ─── */

export type FabricVariantStatus = 'active' | 'draft' | 'discontinued';

export type FabricBaseUom = 'meter' | 'yard' | 'kg';

export type FabricVariant = {
  id: string;
  fabric_catalog_id: string;
  variant_code: string;

  /* Level 1: Quy cach thuc te (Ky thuat Det) */
  color_name: string;
  color_hex: string | null;
  actual_width_cm: number | null;
  actual_gsm: number | null;
  shrinkage_rate_warp: number | null;
  shrinkage_rate_weft: number | null;

  /* Level 2: Quan ly Kho & Don vi tinh */
  base_uom: FabricBaseUom;
  conversion_rate: number | null;

  /* Level 3: Truy xuat nguon & Van hanh */
  lot_number: string | null;
  supplier_id: string | null;
  sku: string | null;
  barcode: string | null;
  moq: number | null;

  /* Pricing */
  purchase_price: number | null;
  selling_price: number | null;

  /* Metadata */
  status: FabricVariantStatus;
  image_url: string | null;
  notes: string | null;
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
};

export type FabricVariantFilter = {
  search?: string;
  status?: FabricVariantStatus;
};

/** FabricCatalog with nested variants for detail view */
export type FabricCatalogWithVariants = FabricCatalog & {
  variants: FabricVariant[];
};
