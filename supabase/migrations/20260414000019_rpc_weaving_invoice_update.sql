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
