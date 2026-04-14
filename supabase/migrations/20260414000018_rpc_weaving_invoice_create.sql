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
    invoice_number, supplier_id, invoice_date, fabric_type,
    unit_price_per_kg, notes, status, created_by
  ) VALUES (
    p_header->>'invoice_number',
    (p_header->>'supplier_id')::UUID,
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
