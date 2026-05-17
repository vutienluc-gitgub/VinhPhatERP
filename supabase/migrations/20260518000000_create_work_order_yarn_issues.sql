-- ============================================================
-- Work Order Yarn Issues — Track actual yarn lots issued per WO
-- ============================================================

-- 1. Create the tracking table
CREATE TABLE IF NOT EXISTS work_order_yarn_issues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id     UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  yarn_receipt_item_id UUID NOT NULL REFERENCES yarn_receipt_items(id) ON DELETE RESTRICT,
  issued_kg   NUMERIC NOT NULL CHECK (issued_kg > 0),
  notes       TEXT,
  tenant_id   UUID REFERENCES tenants(id),
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_woyi_work_order ON work_order_yarn_issues(work_order_id);
CREATE INDEX IF NOT EXISTS idx_woyi_receipt_item ON work_order_yarn_issues(yarn_receipt_item_id);
CREATE INDEX IF NOT EXISTS idx_woyi_tenant ON work_order_yarn_issues(tenant_id);

-- 2. RLS
ALTER TABLE work_order_yarn_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation — work_order_yarn_issues"
  ON work_order_yarn_issues
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- 3. View: Available yarn receipt items (stock - issued) per yarn_catalog_id
CREATE OR REPLACE VIEW v_yarn_receipt_item_availability AS
SELECT
  yri.id              AS yarn_receipt_item_id,
  yri.yarn_catalog_id,
  yri.receipt_id,
  yr.receipt_number,
  yr.receipt_date,
  yr.supplier_id,
  s.name              AS supplier_name,
  yri.yarn_type,
  yri.lot_number,
  yri.color_name,
  yri.grade,
  yri.unit,
  yri.quantity         AS received_qty,
  COALESCE(issued.total_issued, 0) AS issued_qty,
  yri.quantity - COALESCE(issued.total_issued, 0) AS available_qty,
  yri.landed_price,
  yri.tenant_id
FROM yarn_receipt_items yri
JOIN yarn_receipts yr ON yr.id = yri.receipt_id
JOIN suppliers s ON s.id = yr.supplier_id
LEFT JOIN (
  SELECT
    yarn_receipt_item_id,
    SUM(issued_kg) AS total_issued
  FROM work_order_yarn_issues
  GROUP BY yarn_receipt_item_id
) issued ON issued.yarn_receipt_item_id = yri.id
WHERE yr.status = 'confirmed'
  AND (yri.quantity - COALESCE(issued.total_issued, 0)) > 0;

-- 4. RPC: Atomic issue yarn lots for a work order
CREATE OR REPLACE FUNCTION rpc_issue_yarn_lots(
  p_work_order_id UUID,
  p_lots          JSONB  -- array of { yarn_receipt_item_id, issued_kg, notes? }
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id   UUID;
  v_lot       JSONB;
  v_avail     NUMERIC;
  v_wo_status TEXT;
BEGIN
  -- Resolve tenant + user
  v_tenant_id := current_setting('app.current_tenant_id', true)::uuid;
  v_user_id   := auth.uid();

  -- Validate WO exists and is in draft status
  SELECT status INTO v_wo_status
    FROM work_orders
   WHERE id = p_work_order_id
     AND tenant_id = v_tenant_id;

  IF v_wo_status IS NULL THEN
    RAISE EXCEPTION 'Work order not found';
  END IF;

  IF v_wo_status NOT IN ('draft') THEN
    RAISE EXCEPTION 'Work order must be in draft status to issue yarn. Current: %', v_wo_status;
  END IF;

  -- Insert each lot
  FOR v_lot IN SELECT * FROM jsonb_array_elements(p_lots)
  LOOP
    -- Check available stock
    SELECT (yri.quantity - COALESCE(SUM(wi.issued_kg), 0))
      INTO v_avail
      FROM yarn_receipt_items yri
      LEFT JOIN work_order_yarn_issues wi ON wi.yarn_receipt_item_id = yri.id
     WHERE yri.id = (v_lot->>'yarn_receipt_item_id')::uuid
     GROUP BY yri.id, yri.quantity;

    IF v_avail IS NULL OR v_avail < (v_lot->>'issued_kg')::numeric THEN
      RAISE EXCEPTION 'Insufficient stock for yarn_receipt_item_id=%: available=%, requested=%',
        v_lot->>'yarn_receipt_item_id',
        COALESCE(v_avail, 0),
        v_lot->>'issued_kg';
    END IF;

    INSERT INTO work_order_yarn_issues (
      work_order_id, yarn_receipt_item_id, issued_kg, notes, tenant_id, created_by
    ) VALUES (
      p_work_order_id,
      (v_lot->>'yarn_receipt_item_id')::uuid,
      (v_lot->>'issued_kg')::numeric,
      v_lot->>'notes',
      v_tenant_id,
      v_user_id
    );
  END LOOP;

  -- Transition WO status to yarn_issued
  UPDATE work_orders
     SET status = 'yarn_issued',
         updated_at = now()
   WHERE id = p_work_order_id
     AND tenant_id = v_tenant_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION rpc_issue_yarn_lots(UUID, JSONB) TO authenticated;
