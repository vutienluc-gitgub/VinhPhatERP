-- =============================================================
-- Migration: Create cost_estimations table
-- Purpose: Persist greige fabric cost estimation data
--          linked to work_orders, bom, or quotations.
-- =============================================================

-- 1. Create enum type for reference_type
DO $$ BEGIN
  CREATE TYPE cost_estimation_ref_type AS ENUM ('work_order', 'bom', 'quotation');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create table
CREATE TABLE IF NOT EXISTS cost_estimations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id),

  -- Polymorphic reference: what this estimation belongs to
  reference_type  cost_estimation_ref_type NOT NULL,
  reference_id    uuid NOT NULL,

  -- Version tracking (allows multiple estimations per reference)
  version         int NOT NULL DEFAULT 1,

  -- Fabric specs at time of estimation
  target_width_cm numeric,
  target_gsm      numeric,

  -- Cost parameters
  est_yarn_price          numeric NOT NULL DEFAULT 0,
  est_profit_margin_pct   numeric NOT NULL DEFAULT 0,
  est_transport_cost      numeric NOT NULL DEFAULT 0,
  est_additional_costs    jsonb   NOT NULL DEFAULT '[]'::jsonb,

  -- Computed results (stored for audit trail)
  est_total_cost          numeric NOT NULL DEFAULT 0,
  suggested_price         numeric NOT NULL DEFAULT 0,

  -- Audit
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id),

  -- Prevent duplicate versions per reference
  UNIQUE (tenant_id, reference_type, reference_id, version)
);

-- 3. RLS
ALTER TABLE cost_estimations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON cost_estimations
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_cost_est_ref
  ON cost_estimations(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_cost_est_tenant
  ON cost_estimations(tenant_id);

-- 5. Comment
COMMENT ON TABLE cost_estimations IS 'Luu tru du toan gia thanh vai moc (Greige Fabric Cost Estimation). Moi ban du toan gan voi 1 Lenh SX, 1 BOM hoac 1 Bao Gia.';
