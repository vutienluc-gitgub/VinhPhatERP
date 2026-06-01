-- ============================================================
-- Migration: Create Knitting Engineering Master Data
-- Description: 4-tier architecture for Yarn - Machine compatibility
-- ============================================================

-- 1. Create Fabric Structures
CREATE TABLE IF NOT EXISTS public.fabric_structures (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id),
  code        text NOT NULL,
  name        text NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fabric_structures_code_tenant_uq UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_fabric_structures_tenant ON public.fabric_structures(tenant_id);

CREATE OR REPLACE FUNCTION public.fn_fabric_structures_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fabric_structures_updated_at ON public.fabric_structures;
CREATE TRIGGER trg_fabric_structures_updated_at
  BEFORE UPDATE ON public.fabric_structures
  FOR EACH ROW EXECUTE FUNCTION public.fn_fabric_structures_updated_at();

ALTER TABLE public.fabric_structures ENABLE ROW LEVEL SECURITY;
CREATE POLICY fabric_structures_tenant_isolation ON public.fabric_structures
  FOR ALL USING (tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid);


-- 2. Create Machine Specifications
CREATE TABLE IF NOT EXISTS public.machine_specifications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES public.tenants(id),
  manufacturer   text,
  machine_family text, -- e.g., 'Single Jersey', 'Rib'
  machine_type   text, -- maps to loom_type
  diameter       numeric,
  gauge          integer,
  feeder_count   integer,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  -- Allow NULL in gauge, but need a constraint logic. A unique constraint treating NULL as equal is complex in Postgres before v15.
  -- We'll just rely on a standard UNIQUE constraint and handle NULLs gracefully or use COALESCE in app logic.
  -- To be safe, we create a UNIQUE NULLS NOT DISTINCT if on Postgres 15+, or just standard UNIQUE.
  CONSTRAINT machine_specifications_uq UNIQUE NULLS NOT DISTINCT (tenant_id, manufacturer, machine_family, machine_type, diameter, gauge, feeder_count)
);

CREATE INDEX IF NOT EXISTS idx_machine_specifications_tenant ON public.machine_specifications(tenant_id);

CREATE OR REPLACE FUNCTION public.fn_machine_specs_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_machine_specs_updated_at ON public.machine_specifications;
CREATE TRIGGER trg_machine_specs_updated_at
  BEFORE UPDATE ON public.machine_specifications
  FOR EACH ROW EXECUTE FUNCTION public.fn_machine_specs_updated_at();

ALTER TABLE public.machine_specifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY machine_specifications_tenant_isolation ON public.machine_specifications
  FOR ALL USING (tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid);


-- 3. Create Yarn Knitting Engineering Matrix
CREATE TABLE IF NOT EXISTS public.yarn_knitting_engineering (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 uuid NOT NULL REFERENCES public.tenants(id),
  yarn_id                   uuid NOT NULL REFERENCES public.yarn_catalogs(id) ON DELETE CASCADE,
  fabric_structure_id       uuid NOT NULL REFERENCES public.fabric_structures(id),
  machine_spec_id           uuid NOT NULL REFERENCES public.machine_specifications(id),
  
  compatibility_level       text NOT NULL CHECK (compatibility_level IN ('preferred', 'recommended', 'allowed', 'restricted', 'forbidden')),
  recommended_rpm           integer,
  max_rpm                   integer,
  expected_efficiency       numeric CHECK (expected_efficiency >= 0 AND expected_efficiency <= 1),
  expected_waste_pct        numeric CHECK (expected_waste_pct >= 0 AND expected_waste_pct <= 1),
  quality_risk_level        text CHECK (quality_risk_level IN ('low', 'medium', 'high')),
  need_special_feeder       boolean DEFAULT false,
  need_lycra_attachment     boolean DEFAULT false,
  recommended_tension       text, -- e.g. '12 - 15 cN'
  feeding_type              text CHECK (feeding_type IN ('positive', 'negative', 'auto')),
  recommended_stitch_length numeric, -- mm
  historical_quality_score  numeric,
  production_notes          text,

  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT yarn_knitting_engineering_uq UNIQUE (tenant_id, yarn_id, fabric_structure_id, machine_spec_id)
);

CREATE INDEX IF NOT EXISTS idx_yarn_knitting_eng_tenant ON public.yarn_knitting_engineering(tenant_id);
CREATE INDEX IF NOT EXISTS idx_yarn_knitting_eng_yarn ON public.yarn_knitting_engineering(yarn_id);

CREATE OR REPLACE FUNCTION public.fn_yarn_knitting_eng_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_yarn_knitting_eng_updated_at ON public.yarn_knitting_engineering;
CREATE TRIGGER trg_yarn_knitting_eng_updated_at
  BEFORE UPDATE ON public.yarn_knitting_engineering
  FOR EACH ROW EXECUTE FUNCTION public.fn_yarn_knitting_eng_updated_at();

ALTER TABLE public.yarn_knitting_engineering ENABLE ROW LEVEL SECURITY;
CREATE POLICY yarn_knitting_engineering_tenant_isolation ON public.yarn_knitting_engineering
  FOR ALL USING (tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid);


-- ============================================================
-- 4. Seed Data Script
-- ============================================================
DO $$
DECLARE
  t RECORD;
BEGIN
  -- Loop through all existing tenants to seed master data per tenant
  FOR t IN SELECT id FROM public.tenants LOOP
    
    -- 4.1. Seed Fabric Structures
    INSERT INTO public.fabric_structures (tenant_id, code, name)
    VALUES 
      (t.id, 'SJ', 'Single Jersey'),
      (t.id, 'RIB', 'Rib'),
      (t.id, 'INT', 'Interlock'),
      (t.id, 'FLC', 'Fleece'),
      (t.id, 'PIQ', 'Pique')
    ON CONFLICT (tenant_id, code) DO NOTHING;

    -- 4.2. Seed Machine Specifications from existing Looms
    -- Note: manufacturer and machine_family are NULL initially if we can't infer them
    -- loom_type is used as machine_type
    -- max_width_cm is used as diameter
    INSERT INTO public.machine_specifications (
      tenant_id, 
      machine_type, 
      diameter, 
      feeder_count, 
      gauge,
      machine_family,
      manufacturer
    )
    SELECT DISTINCT
      t.id,
      loom_type,
      max_width_cm,
      NULL::integer, -- feeder count unknown
      NULL::integer, -- gauge unknown
      -- Try to infer family from loom_type
      CASE 
        WHEN loom_type = 'single_jersey' THEN 'Single Jersey'
        WHEN loom_type = 'rib' THEN 'Rib'
        WHEN loom_type = 'interlock' THEN 'Interlock'
        WHEN loom_type = 'fleece' THEN 'Fleece'
        WHEN loom_type = 'jacquard' THEN 'Jacquard'
        ELSE loom_type
      END as machine_family,
      NULL::text -- manufacturer unknown
    FROM public.looms
    WHERE tenant_id = t.id AND loom_type IS NOT NULL AND max_width_cm IS NOT NULL
    ON CONFLICT (tenant_id, manufacturer, machine_family, machine_type, diameter, gauge, feeder_count) DO NOTHING;

  END LOOP;
END $$;
