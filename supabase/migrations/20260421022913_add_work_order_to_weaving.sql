-- Add work_order_id to weaving_invoices and update RPCs

ALTER TABLE weaving_invoices 
ADD COLUMN IF NOT EXISTS work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL;

-- Update the Create RPC
CREATE OR REPLACE FUNCTION atomic_create_weaving_invoice(
  p_header JSONB,
  p_rolls JSONB
) RETURNS JSONB AS $$
DECLARE
  v_invoice_id UUID;
  v_total_weight NUMERIC;
  v_total_amount NUMERIC;
  v_result JSONB;
BEGIN
  -- Insert header
  INSERT INTO weaving_invoices (
    invoice_number, supplier_id, work_order_id, invoice_date, fabric_type,
    unit_price_per_kg, notes, status, created_by
  ) VALUES (
    p_header->>'invoice_number',
    (p_header->>'supplier_id')::UUID,
    NULLIF(p_header->>'work_order_id', '')::UUID,
    (p_header->>'invoice_date')::DATE,
    p_header->>'fabric_type',
    (p_header->>'unit_price_per_kg')::NUMERIC,
    p_header->>'notes',
    COALESCE(p_header->>'status', 'draft'),
    NULLIF(p_header->>'created_by', '')::UUID
  )
  RETURNING id INTO v_invoice_id;

  -- Insert rolls
  IF p_rolls IS NOT NULL AND jsonb_array_length(p_rolls) > 0 THEN
    INSERT INTO weaving_invoice_rolls (
      invoice_id, roll_number, weight_kg, length_m,
      quality_grade, warehouse_location, lot_number, notes, sort_order
    )
    SELECT
      v_invoice_id,
      r->>'roll_number',
      (r->>'weight_kg')::NUMERIC,
      NULLIF(r->>'length_m', '')::NUMERIC,
      r->>'quality_grade',
      r->>'warehouse_location',
      r->>'lot_number',
      r->>'notes',
      (r->>'sort_order')::INTEGER
    FROM jsonb_array_elements(p_rolls) AS r;
  END IF;

  -- Recalculate totals from actual inserted rolls
  SELECT COALESCE(SUM(weight_kg), 0) INTO v_total_weight
  FROM weaving_invoice_rolls WHERE invoice_id = v_invoice_id;

  v_total_amount := v_total_weight * (p_header->>'unit_price_per_kg')::NUMERIC;

  UPDATE weaving_invoices
  SET total_weight_kg = v_total_weight, total_amount = v_total_amount
  WHERE id = v_invoice_id;

  SELECT to_jsonb(t) INTO v_result FROM weaving_invoices t WHERE id = v_invoice_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Update the Update RPC
CREATE OR REPLACE FUNCTION atomic_update_weaving_invoice(
  p_id UUID,
  p_header JSONB,
  p_rolls JSONB
) RETURNS VOID AS $$
DECLARE
  v_total_weight NUMERIC;
  v_total_amount NUMERIC;
  v_unit_price NUMERIC;
BEGIN
  -- Only allow update on draft invoices
  IF NOT EXISTS (SELECT 1 FROM weaving_invoices WHERE id = p_id AND status = 'draft') THEN
    RAISE EXCEPTION 'INVOICE_NOT_DRAFT: Cannot update a non-draft invoice';
  END IF;

  -- Update header
  UPDATE weaving_invoices
  SET
    invoice_number = COALESCE(p_header->>'invoice_number', invoice_number),
    supplier_id = COALESCE((p_header->>'supplier_id')::UUID, supplier_id),
    work_order_id = CASE WHEN p_header ? 'work_order_id' THEN NULLIF(p_header->>'work_order_id', '')::UUID ELSE work_order_id END,
    invoice_date = COALESCE((p_header->>'invoice_date')::DATE, invoice_date),
    fabric_type = COALESCE(p_header->>'fabric_type', fabric_type),
    unit_price_per_kg = COALESCE((p_header->>'unit_price_per_kg')::NUMERIC, unit_price_per_kg),
    notes = CASE
      WHEN p_header ? 'notes' THEN NULLIF(p_header->>'notes', '')
      ELSE notes
    END
  WHERE id = p_id;

  -- Replace rolls atomically
  IF p_rolls IS NOT NULL THEN
    DELETE FROM weaving_invoice_rolls WHERE invoice_id = p_id;

    INSERT INTO weaving_invoice_rolls (
      invoice_id, roll_number, weight_kg, length_m,
      quality_grade, warehouse_location, lot_number, notes, sort_order
    )
    SELECT
      p_id,
      r->>'roll_number',
      (r->>'weight_kg')::NUMERIC,
      NULLIF(r->>'length_m', '')::NUMERIC,
      r->>'quality_grade',
      r->>'warehouse_location',
      r->>'lot_number',
      r->>'notes',
      (r->>'sort_order')::INTEGER
    FROM jsonb_array_elements(p_rolls) AS r;
  END IF;

  -- Recalculate totals
  SELECT COALESCE(SUM(weight_kg), 0) INTO v_total_weight
  FROM weaving_invoice_rolls WHERE invoice_id = p_id;

  SELECT unit_price_per_kg INTO v_unit_price
  FROM weaving_invoices WHERE id = p_id;

  v_total_amount := v_total_weight * v_unit_price;

  UPDATE weaving_invoices
  SET total_weight_kg = v_total_weight, total_amount = v_total_amount
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
