-- ============================================================
-- Migration: Create loom_production_states
-- ============================================================

CREATE TABLE IF NOT EXISTS public.loom_production_states (
  loom_id               uuid PRIMARY KEY REFERENCES public.looms(id) ON DELETE CASCADE,
  tenant_id             uuid NOT NULL REFERENCES public.tenants(id),
  current_work_order_id uuid REFERENCES public.work_orders(id),
  current_employee_id   uuid REFERENCES public.employees(id),
  efficiency_pct        numeric DEFAULT 0,
  running_hours         numeric DEFAULT 0,
  last_status_changed_at timestamptz DEFAULT now(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT loom_production_states_efficiency_chk CHECK (efficiency_pct >= 0 AND efficiency_pct <= 100)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_loom_prod_states_tenant ON public.loom_production_states(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loom_prod_states_wo ON public.loom_production_states(current_work_order_id);

-- Auto-update updated_at
CREATE TRIGGER trg_loom_production_states_updated_at
  BEFORE UPDATE ON public.loom_production_states
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_looms_updated_at();

-- RLS
ALTER TABLE public.loom_production_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY loom_production_states_tenant_isolation ON public.loom_production_states
  FOR ALL
  USING (tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid);

-- Trigger to auto-create state record when a new loom is created
CREATE OR REPLACE FUNCTION public.fn_auto_create_loom_production_state()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.loom_production_states (loom_id, tenant_id)
  VALUES (NEW.id, NEW.tenant_id)
  ON CONFLICT (loom_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_create_loom_state ON public.looms;
CREATE TRIGGER trg_auto_create_loom_state
  AFTER INSERT ON public.looms
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_create_loom_production_state();

-- Seed states for existing looms
INSERT INTO public.loom_production_states (loom_id, tenant_id, efficiency_pct)
SELECT id, tenant_id, 0
FROM public.looms
ON CONFLICT (loom_id) DO NOTHING;
