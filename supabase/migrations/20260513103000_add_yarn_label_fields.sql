-- Migration: Add manufacturer label fields to yarn_receipt_items
-- Fields from yarn carton labels: net_weight, gross_weight, serial_number, production_week, dist

-- 1. Add new columns
ALTER TABLE yarn_receipt_items
  ADD COLUMN IF NOT EXISTS net_weight NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gross_weight NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS serial_number TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS production_week SMALLINT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dist TEXT DEFAULT NULL;

-- 2. Add comments
COMMENT ON COLUMN yarn_receipt_items.net_weight IS 'Net weight (N.W) from manufacturer label';
COMMENT ON COLUMN yarn_receipt_items.gross_weight IS 'Gross weight (G.W) from manufacturer label';
COMMENT ON COLUMN yarn_receipt_items.serial_number IS 'Serial number from manufacturer label';
COMMENT ON COLUMN yarn_receipt_items.production_week IS 'Production week number from manufacturer label';
COMMENT ON COLUMN yarn_receipt_items.dist IS 'Distribution info from manufacturer label';

-- 3. Recreate RPC: rpc_create_yarn_receipt with new fields
CREATE OR REPLACE FUNCTION rpc_create_yarn_receipt(
  p_header JSONB,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_receipt_id UUID;
  v_receipt_number TEXT;
  v_result JSONB;
  v_total_fees NUMERIC := 0;
  v_total_qty NUMERIC := 0;
  v_tenant UUID;
BEGIN
  v_tenant := (p_header->>'tenant_id')::UUID;
  IF v_tenant IS NULL THEN
    v_tenant := current_tenant_id();
  END IF;

  -- Auto-generate receipt_number if not provided
  v_receipt_number := p_header->>'receipt_number';
  IF v_receipt_number IS NULL OR v_receipt_number = '' THEN
    v_receipt_number := generate_next_doc_number(
      'yarn_receipts', 'receipt_number', 'NS-', 3
    );
  END IF;

  -- Tính tổng chi phí vận chuyển, bốc xếp...
  SELECT COALESCE(SUM((fee->>'amount')::NUMERIC), 0)
  INTO v_total_fees
  FROM jsonb_array_elements(COALESCE(p_header->'additional_fees', '[]'::jsonb)) AS fee;

  -- Tính tổng số lượng hàng hóa để phân bổ
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    SELECT COALESCE(SUM((item->>'quantity')::NUMERIC), 0)
    INTO v_total_qty
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  INSERT INTO yarn_receipts (
    receipt_number, supplier_id, receipt_date, notes, status, total_amount, tenant_id,
    vehicle_info, additional_fees
  ) VALUES (
    v_receipt_number,
    (p_header->>'supplier_id')::UUID,
    (p_header->>'receipt_date')::DATE,
    p_header->>'notes',
    COALESCE(p_header->>'status', 'draft')::doc_status,
    (p_header->>'total_amount')::NUMERIC,
    v_tenant,
    p_header->>'vehicle_info',
    COALESCE(p_header->'additional_fees', '[]'::jsonb)
  )
  RETURNING id INTO v_receipt_id;

  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO yarn_receipt_items (
      receipt_id, yarn_type, color_name, unit, quantity, unit_price,
      lot_number, grade, tensile_strength, composition, origin, yarn_catalog_id, sort_order,
      allocated_cost, landed_price, tenant_id,
      net_weight, gross_weight, serial_number, production_week, dist
    )
    SELECT
      v_receipt_id,
      item->>'yarn_type',
      item->>'color_name',
      COALESCE(item->>'unit', 'kg'),
      (item->>'quantity')::NUMERIC,
      (item->>'unit_price')::NUMERIC,
      item->>'lot_number',
      item->>'grade',
      item->>'tensile_strength',
      item->>'composition',
      item->>'origin',
      NULLIF(item->>'yarn_catalog_id', '')::UUID,
      (item->>'sort_order')::INTEGER,
      CASE WHEN v_total_qty > 0 THEN v_total_fees * (item->>'quantity')::NUMERIC / v_total_qty ELSE 0 END,
      (item->>'unit_price')::NUMERIC + CASE WHEN v_total_qty > 0 THEN (v_total_fees / v_total_qty) ELSE 0 END,
      v_tenant,
      NULLIF(item->>'net_weight', '')::NUMERIC,
      NULLIF(item->>'gross_weight', '')::NUMERIC,
      NULLIF(item->>'serial_number', ''),
      NULLIF(item->>'production_week', '')::SMALLINT,
      NULLIF(item->>'dist', '')
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  SELECT to_jsonb(t) INTO v_result FROM yarn_receipts t WHERE id = v_receipt_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Recreate RPC: rpc_update_yarn_receipt with new fields
CREATE OR REPLACE FUNCTION rpc_update_yarn_receipt(
  p_id UUID,
  p_header JSONB,
  p_items JSONB,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_current_updated_at TIMESTAMPTZ;
  v_total_fees NUMERIC := 0;
  v_total_qty NUMERIC := 0;
  v_tenant UUID;
BEGIN
  -- Optimistic Concurrency Control
  IF p_expected_updated_at IS NOT NULL THEN
    SELECT updated_at INTO v_current_updated_at
    FROM yarn_receipts
    WHERE id = p_id;
    
    IF v_current_updated_at != p_expected_updated_at THEN
      RAISE EXCEPTION 'OCC_MISMATCH';
    END IF;
  END IF;

  v_tenant := (p_header->>'tenant_id')::UUID;
  IF v_tenant IS NULL THEN
    SELECT tenant_id INTO v_tenant FROM yarn_receipts WHERE id = p_id;
  END IF;

  -- Tính tổng chi phí
  SELECT COALESCE(SUM((fee->>'amount')::NUMERIC), 0)
  INTO v_total_fees
  FROM jsonb_array_elements(COALESCE(p_header->'additional_fees', '[]'::jsonb)) AS fee;

  -- Tính tổng số lượng
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    SELECT COALESCE(SUM((item->>'quantity')::NUMERIC), 0)
    INTO v_total_qty
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  UPDATE yarn_receipts
  SET
    receipt_number = COALESCE(NULLIF(p_header->>'receipt_number', ''), receipt_number),
    supplier_id = COALESCE((p_header->>'supplier_id')::UUID, supplier_id),
    receipt_date = COALESCE((p_header->>'receipt_date')::DATE, receipt_date),
    notes = CASE WHEN (p_header->>'notes') IS NOT NULL AND (p_header->>'notes') = '' THEN NULL ELSE COALESCE(CASE WHEN jsonb_typeof(p_header->'notes') = 'null' THEN NULL ELSE p_header->>'notes' END, notes) END,
    total_amount = COALESCE((p_header->>'total_amount')::NUMERIC, total_amount),
    vehicle_info = CASE WHEN jsonb_typeof(p_header->'vehicle_info') = 'null' THEN NULL ELSE COALESCE(p_header->>'vehicle_info', vehicle_info) END,
    additional_fees = CASE WHEN jsonb_typeof(p_header->'additional_fees') = 'null' THEN '[]'::jsonb ELSE COALESCE(p_header->'additional_fees', additional_fees) END
  WHERE id = p_id;

  IF p_items IS NOT NULL THEN
    DELETE FROM yarn_receipt_items WHERE receipt_id = p_id;

    INSERT INTO yarn_receipt_items (
      receipt_id, yarn_type, color_name, unit, quantity, unit_price,
      lot_number, grade, tensile_strength, composition, origin, yarn_catalog_id, sort_order,
      allocated_cost, landed_price, tenant_id,
      net_weight, gross_weight, serial_number, production_week, dist
    )
    SELECT
      p_id,
      item->>'yarn_type',
      item->>'color_name',
      COALESCE(item->>'unit', 'kg'),
      (item->>'quantity')::NUMERIC,
      (item->>'unit_price')::NUMERIC,
      item->>'lot_number',
      item->>'grade',
      item->>'tensile_strength',
      item->>'composition',
      item->>'origin',
      NULLIF(item->>'yarn_catalog_id', '')::UUID,
      (item->>'sort_order')::INTEGER,
      CASE WHEN v_total_qty > 0 THEN v_total_fees * (item->>'quantity')::NUMERIC / v_total_qty ELSE 0 END,
      (item->>'unit_price')::NUMERIC + CASE WHEN v_total_qty > 0 THEN (v_total_fees / v_total_qty) ELSE 0 END,
      v_tenant,
      NULLIF(item->>'net_weight', '')::NUMERIC,
      NULLIF(item->>'gross_weight', '')::NUMERIC,
      NULLIF(item->>'serial_number', ''),
      NULLIF(item->>'production_week', '')::SMALLINT,
      NULLIF(item->>'dist', '')
    FROM jsonb_array_elements(p_items) AS item;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
