-- Migration: Create fabric_variants table (Master-Detail for fabric catalog)
-- Parent: fabric_catalogs (FC-011, Tên, Thành phần, Khổ chuẩn, GSM chuẩn)
-- Child: fabric_variants (FC-011-BLACK, Màu, Quy cách thực tế, Giá, Kho, Truy xuất)

-- ── Enum for variant status ──────────────────────────
DO $$ BEGIN
  CREATE TYPE fabric_variant_status AS ENUM ('active', 'draft', 'discontinued');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Enum for base UOM ────────────────────────────────
DO $$ BEGIN
  CREATE TYPE fabric_uom AS ENUM ('meter', 'yard', 'kg');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Table: fabric_variants ───────────────────────────
CREATE TABLE IF NOT EXISTS public.fabric_variants (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fabric_catalog_id UUID NOT NULL REFERENCES fabric_catalogs(id) ON DELETE RESTRICT,

    -- Auto-generated code: FC-011-BLACK
    variant_code  TEXT NOT NULL,

    -- Level 1: Quy cach thuc te (Ky thuat Det)
    color_name    TEXT NOT NULL,
    color_hex     TEXT,                       -- #000000
    actual_width_cm  NUMERIC,                 -- Kho thuc te sau nhuom (cm)
    actual_gsm       NUMERIC,                 -- Trong luong thuc te sau nhuom (g/m2)
    shrinkage_rate_warp NUMERIC DEFAULT 0,    -- Do rut doc (%)
    shrinkage_rate_weft NUMERIC DEFAULT 0,    -- Do rut ngang (%)

    -- Level 2: Quan ly Kho & Don vi tinh
    base_uom      fabric_uom NOT NULL DEFAULT 'kg',
    conversion_rate NUMERIC,                  -- So met / kg = 1000 / (actual_gsm * actual_width_m)

    -- Level 3: Truy xuat nguon & Van hanh
    lot_number    TEXT,                       -- So lo nhuom / Me san xuat
    supplier_id   UUID REFERENCES suppliers(id),
    sku           TEXT,                       -- Ma vach quet kho (VD: 11070011.BLACK.L01)
    barcode       TEXT,
    moq           NUMERIC,                   -- Minimum Order Quantity (kg)

    -- Pricing
    purchase_price NUMERIC,                  -- Gia nhap
    selling_price  NUMERIC,                  -- Gia ban

    -- Metadata
    status        fabric_variant_status NOT NULL DEFAULT 'active',
    image_url     TEXT,
    notes         TEXT,
    tenant_id     UUID REFERENCES tenants(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_variant_code_tenant UNIQUE (variant_code, tenant_id)
);

-- ── Indexes ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fabric_variants_catalog
  ON fabric_variants(fabric_catalog_id);

CREATE INDEX IF NOT EXISTS idx_fabric_variants_tenant_status
  ON fabric_variants(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_fabric_variants_sku
  ON fabric_variants(sku) WHERE sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fabric_variants_barcode
  ON fabric_variants(barcode) WHERE barcode IS NOT NULL;

-- ── RLS ──────────────────────────────────────────────
ALTER TABLE public.fabric_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY fabric_variants_tenant_select ON public.fabric_variants
  FOR SELECT USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY fabric_variants_tenant_insert ON public.fabric_variants
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY fabric_variants_tenant_update ON public.fabric_variants
  FOR UPDATE USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY fabric_variants_tenant_delete ON public.fabric_variants
  FOR DELETE USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

-- ── Updated_at trigger ───────────────────────────────
CREATE TRIGGER trg_fabric_variants_updated_at
  BEFORE UPDATE ON public.fabric_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── Comments ─────────────────────────────────────────
COMMENT ON TABLE fabric_variants IS 'Bien the mau/lot cua tung loai vai trong fabric_catalogs. Luu quy cach thuc te sau nhuom, gia, kho, truy xuat.';
COMMENT ON COLUMN fabric_variants.actual_width_cm IS 'Kho thuc te sau nhuom (cm). Khac kho chuan cua Master do co rut.';
COMMENT ON COLUMN fabric_variants.actual_gsm IS 'Trong luong thuc te sau nhuom (g/m2). Anh huong truc tiep den gia tinh theo Kg.';
COMMENT ON COLUMN fabric_variants.shrinkage_rate_warp IS 'Do rut doc (%). Dung cho R&D tinh dinh muc (Consumption).';
COMMENT ON COLUMN fabric_variants.shrinkage_rate_weft IS 'Do rut ngang (%). Dung cho R&D tinh dinh muc (Consumption).';
COMMENT ON COLUMN fabric_variants.base_uom IS 'Don vi tinh co so: meter, yard, kg. Vai thun thuong tinh Kg, vai det thuong tinh Yard.';
COMMENT ON COLUMN fabric_variants.conversion_rate IS 'So met/kg = 1000 / (actual_gsm * actual_width_m). Chia khoa vang quy doi kho.';
COMMENT ON COLUMN fabric_variants.moq IS 'So luong dat toi thieu (kg). Xuong nhuom thuong yeu cau toi thieu 300kg/mau.';
