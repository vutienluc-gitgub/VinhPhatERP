/**
 * Fabric-catalog domain types.
 * Pure TypeScript — no React or Supabase dependency.
 */
export type FabricCatalogStatus = 'active' | 'inactive';

export type StretchType =
  | 'NONE'
  | 'HORIZONTAL'
  | 'VERTICAL'
  | 'TWO_WAY'
  | 'FOUR_WAY';
export type ThicknessType = 'THIN' | 'MEDIUM' | 'THICK' | 'EXTRA_THICK';
export type StockStatusType =
  | 'SAMPLE_AVAILABLE'
  | 'READY_STOCK'
  | 'CUSTOM_ORDER'
  | 'OUT_OF_STOCK';

export type FabricApplicationNormalized = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  description: string | null;
};

export type GarmentConversionRule = {
  id: string;
  key: string;
  name: string;
  avg_consumption_kg: number;
  description: string | null;
  is_active: boolean;
};

export type FabricCharacteristicNormalized = {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
};

export type FabricCommercial = {
  sample_status: 'AVAILABLE' | 'OUT_OF_STOCK' | 'PREPARING';
  stock_status: 'READY' | 'CUSTOM' | 'OUT_OF_STOCK' | 'COMING_SOON';
  minimum_order_qty: number | null;
  minimum_order_unit: string | null;
  lead_time_min: number | null;
  lead_time_max: number | null;
  lead_time_unit: string | null;
  origin_country: string | null;
  minimum_order_qty_kg?: number | null;
  lead_time_days?: number | null;
  production_capacity_monthly_tons?: number | null;
  yield_factor?: number | null;
  public_stock_display?: 'none' | 'status' | 'quantity' | null;
  trust_has_sample?: boolean | null;
  trust_fast_delivery?: boolean | null;
  trust_tech_support?: boolean | null;
  standard_consumption_kg?: number | null;
};

export type FabricVariantCommercial = {
  minimum_stock_order: number | null;
  minimum_custom_order: number | null;
  lead_time_stock: number | null;
  lead_time_custom: number | null;
  lead_time_unit: string | null;
};

export type FabricImage = {
  id: string;
  variant_id: string | null;
  application_id: string | null;
  type:
    | 'SWATCH'
    | 'SURFACE'
    | 'BACK'
    | 'STRETCH'
    | 'APPLICATION'
    | 'COMPOSITION'
    | 'CERTIFICATE';
  image_url: string;
  alt_text?: string | null;
  caption?: string | null;
  is_primary?: boolean;
  display_order: number;
};

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

  /* Public Catalog Fields */
  applications?: FabricApplicationNormalized[] | null;
  characteristics?: FabricCharacteristicNormalized[] | null;
  stretch_type?: StretchType | null;
  thickness?: ThicknessType | null;
  commercial?: FabricCommercial | null;
  view_count?: number;
  variants?: FabricVariant[];
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

  /* Public Catalog Fields */
  is_public: boolean;
  display_order: number;
  public_image_url: string | null;
  color_standard: 'PANTONE' | 'LAB' | 'CUSTOM';
  color_code: string | null;
  commercial_override: FabricVariantCommercial | null;
  stock_status?: 'in-stock' | 'out-of-stock' | null;
  available_kg?: number | null;
  roll_count?: number | null;
};

export type FabricVariantFilter = {
  search?: string;
  status?: FabricVariantStatus;
};

/** FabricCatalog with nested variants for detail view */
export type FabricCatalogWithVariants = FabricCatalog & {
  variants: FabricVariant[];
};

export type PublicSampleRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DISPATCHED'
  | 'REJECTED';

export type PublicSampleRequest = {
  id: string;
  fabric_catalog_id: string;
  contact_name: string;
  contact_phone: string;
  contact_address: string;
  company_name: string | null;
  selected_variants: Array<{ variant_code: string; color_name: string }> | null;
  status: PublicSampleRequestStatus;
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
};

export type FabricPricingTier = {
  id: string;
  min_quantity: number;
  max_quantity: number | null;
  unit_price: number;
  currency: string;
  display_label?: string | null;
  is_public_visible?: boolean;
};

export type PublicRFQRequestStatus =
  | 'PENDING'
  | 'CONTACTED'
  | 'QUOTED'
  | 'REJECTED';

export type PublicRFQRequest = {
  id: string;
  fabric_catalog_id: string;
  variant_id: string | null;
  quantity: number;
  unit: string;
  target_price: number | null;
  target_delivery_date: string | null;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  company_name: string | null;
  status: PublicRFQRequestStatus;
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
};
