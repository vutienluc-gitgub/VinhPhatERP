-- 1. Master data: Danh mục sản phẩm vải mộc (Fabric Catalogs)
CREATE TABLE IF NOT EXISTS public.fabric_catalogs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,       -- VD: 'RAW-CT-01'
  name          TEXT NOT NULL,              -- VD: 'Cotton TC'
  composition   TEXT,
  unit          TEXT NOT NULL DEFAULT 'm',
  status        public.active_status NOT NULL DEFAULT 'active',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.fabric_catalogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép xem danh mục vải" ON public.fabric_catalogs FOR SELECT USING (true);
CREATE POLICY "Cho phép thêm/sửa danh mục vải" ON public.fabric_catalogs 
  FOR ALL USING (current_user_role() IN ('admin', 'manager'));

-- 2. Enum trạng thái BOM
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bom_status') THEN
        CREATE TYPE public.bom_status AS ENUM ('draft', 'approved', 'deprecated');
    END IF;
END$$;

-- 3. BOM Template (Header)
CREATE TABLE IF NOT EXISTS public.bom_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  target_fabric_id  UUID NOT NULL REFERENCES public.fabric_catalogs(id),
  target_width_cm   INT,
  target_gsm        INT,
  status            public.bom_status NOT NULL DEFAULT 'draft',
  active_version    INT NOT NULL DEFAULT 1,
  standard_loss_pct DECIMAL(5,2) DEFAULT 5,
  notes             TEXT,
  created_by        UUID REFERENCES public.profiles(id),
  approved_by       UUID REFERENCES public.profiles(id),
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.bom_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép xem BOM" ON public.bom_templates FOR SELECT USING (true);
CREATE POLICY "Cho phép quản lý BOM" ON public.bom_templates 
  FOR ALL USING (current_user_role() IN ('admin', 'manager'));

-- 4. BOM Yarn Items (Chi tiết nguyên phụ liệu)
CREATE TABLE IF NOT EXISTS public.bom_yarn_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_template_id      UUID NOT NULL REFERENCES public.bom_templates(id) ON DELETE CASCADE,
  version              INT NOT NULL DEFAULT 1,
  yarn_catalog_id      UUID NOT NULL REFERENCES public.yarn_catalogs(id),
  ratio_pct            DECIMAL(5,2) NOT NULL,
  consumption_kg_per_m DECIMAL(8,4) NOT NULL,
  notes                TEXT,
  sort_order           INT NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index cho tối ưu
CREATE INDEX IF NOT EXISTS idx_bom_yarn_items_template ON public.bom_yarn_items(bom_template_id, version);

-- RLS
ALTER TABLE public.bom_yarn_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép xem BOM items" ON public.bom_yarn_items FOR SELECT USING (true);
CREATE POLICY "Cho phép quản lý BOM items" ON public.bom_yarn_items 
  FOR ALL USING (current_user_role() IN ('admin', 'manager'));

-- 5. BOM Versions (Lịch sử lưu trữ bất biến)
CREATE TABLE IF NOT EXISTS public.bom_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_template_id UUID NOT NULL REFERENCES public.bom_templates(id) ON DELETE CASCADE,
  version         INT NOT NULL,
  change_reason   TEXT NOT NULL,
  snapshot        JSONB NOT NULL,
  created_by      UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bom_template_id, version)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_bom_versions_template ON public.bom_versions(bom_template_id, version);

-- RLS
ALTER TABLE public.bom_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép xem BOM versions" ON public.bom_versions FOR SELECT USING (true);
CREATE POLICY "Cho phép tạo BOM versions" ON public.bom_versions 
  FOR INSERT WITH CHECK (current_user_role() IN ('admin', 'manager'));
-- BOM versions KHÔNG cho phép UPDATE/DELETE
