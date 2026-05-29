-- =============================================================================
-- Migration: Create yarn_slub_specs table
-- Description: Lưu thông số kỹ thuật Slub (length, distance, thick) cho từng
--              bộ thông số (spec_set) của mỗi loại sợi fancy/slub.
-- =============================================================================

-- 1. Tạo bảng
CREATE TABLE IF NOT EXISTS public.yarn_slub_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yarn_catalog_id UUID NOT NULL REFERENCES public.yarn_catalogs(id) ON DELETE CASCADE,
  spec_name TEXT NOT NULL,                    -- VD: 'SLUB7'
  spec_set INT NOT NULL CHECK (spec_set > 0), -- Bộ thông số: 1, 2, 3 ...
  slub_length_min NUMERIC(8,2),               -- cm
  slub_length_max NUMERIC(8,2),               -- cm
  slub_distance_min NUMERIC(8,2),             -- cm
  slub_distance_max NUMERIC(8,2),             -- cm
  slub_thick_min NUMERIC(6,3),                -- %
  slub_thick_max NUMERIC(6,3),                -- %
  notes TEXT,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (yarn_catalog_id, spec_name, spec_set, tenant_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_yarn_slub_specs_catalog ON public.yarn_slub_specs (yarn_catalog_id);
CREATE INDEX IF NOT EXISTS idx_yarn_slub_specs_tenant ON public.yarn_slub_specs (tenant_id);

-- 3. Trigger updated_at
CREATE TRIGGER yarn_slub_specs_updated_at
  BEFORE UPDATE ON public.yarn_slub_specs
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- 4. RLS
ALTER TABLE public.yarn_slub_specs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_yarn_slub_specs
  ON public.yarn_slub_specs FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- 5. Seed data: SLUB7 cho sợi HANO_SLUB
-- Lấy yarn_catalog_id và tenant_id từ record đã seed trước đó
INSERT INTO public.yarn_slub_specs
  (yarn_catalog_id, spec_name, spec_set,
   slub_length_min, slub_length_max,
   slub_distance_min, slub_distance_max,
   slub_thick_min, slub_thick_max,
   tenant_id)
SELECT
  yc.id, 'SLUB7', v.spec_set,
  v.len_min, v.len_max,
  v.dist_min, v.dist_max,
  v.thick_min, v.thick_max,
  yc.tenant_id
FROM public.yarn_catalogs yc
CROSS JOIN (
  VALUES
    (1, 6.0,  13.0,  8.0,  34.0, 1.200, 1.250),
    (2, 4.0,  29.0,  9.0,  44.0, 1.200, 1.300),
    (3, 3.0,   6.0,  8.0,  28.0, 1.150, 1.250)
) AS v(spec_set, len_min, len_max, dist_min, dist_max, thick_min, thick_max)
WHERE yc.code = 'HANO_SLUB'
ON CONFLICT (yarn_catalog_id, spec_name, spec_set, tenant_id) DO UPDATE SET
  slub_length_min   = EXCLUDED.slub_length_min,
  slub_length_max   = EXCLUDED.slub_length_max,
  slub_distance_min = EXCLUDED.slub_distance_min,
  slub_distance_max = EXCLUDED.slub_distance_max,
  slub_thick_min    = EXCLUDED.slub_thick_min,
  slub_thick_max    = EXCLUDED.slub_thick_max;

-- 6. Đánh dấu HANO_SLUB là sợi fancy
UPDATE public.yarn_catalogs
SET is_fancy = true, fancy_details = 'Slub yarn - SLUB7 pattern'
WHERE code = 'HANO_SLUB';
