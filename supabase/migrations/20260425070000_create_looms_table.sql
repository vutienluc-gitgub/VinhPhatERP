-- ============================================================
-- Migration: Create looms table (Danh muc May det)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.looms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id),
  code        text NOT NULL,
  name        text NOT NULL,
  loom_type   text NOT NULL DEFAULT 'rapier',
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id),
  max_width_cm    numeric,
  max_speed_rpm   numeric,
  daily_capacity_m numeric,
  year_manufactured integer,
  status      text NOT NULL DEFAULT 'active',
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT looms_code_tenant_uq UNIQUE (tenant_id, code),
  CONSTRAINT looms_status_chk CHECK (status IN ('active', 'maintenance', 'inactive')),
  CONSTRAINT looms_type_chk CHECK (loom_type IN ('rapier', 'air_jet', 'water_jet', 'shuttle', 'other'))
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_looms_tenant ON public.looms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_looms_supplier ON public.looms(supplier_id);
CREATE INDEX IF NOT EXISTS idx_looms_status ON public.looms(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.fn_looms_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_looms_updated_at ON public.looms;
CREATE TRIGGER trg_looms_updated_at
  BEFORE UPDATE ON public.looms
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_looms_updated_at();

-- RLS
ALTER TABLE public.looms ENABLE ROW LEVEL SECURITY;

CREATE POLICY looms_tenant_isolation ON public.looms
  FOR ALL
  USING (tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid);

-- ============================================================
-- Add loom_id FK to work_orders for traceability
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'work_orders'
      AND column_name = 'loom_id'
  ) THEN
    ALTER TABLE public.work_orders ADD COLUMN loom_id uuid REFERENCES public.looms(id);
    CREATE INDEX idx_work_orders_loom ON public.work_orders(loom_id);
  END IF;
END $$;

-- ============================================================
-- Add loom_id FK to raw_fabric_rolls for traceability
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'raw_fabric_rolls'
      AND column_name = 'loom_id'
  ) THEN
    ALTER TABLE public.raw_fabric_rolls ADD COLUMN loom_id uuid REFERENCES public.looms(id);
    CREATE INDEX idx_raw_fabric_rolls_loom ON public.raw_fabric_rolls(loom_id);
  END IF;
END $$;
