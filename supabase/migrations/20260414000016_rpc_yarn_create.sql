CREATE OR REPLACE FUNCTION atomic_create_yarn_receipt(
  p_header JSONB,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_receipt_id UUID;
  v_result JSONB;
BEGIN
  INSERT INTO yarn_receipts (
    receipt_number, supplier_id, receipt_date, notes, status, total_amount
  ) VALUES (
    p_header->>'receipt_number',
    (p_header->>'supplier_id')::UUID,
    (p_header->>'receipt_date')::DATE,
    p_header->>'notes',
    COALESCE(p_header->>'status', 'draft')::doc_status,
    (p_header->>'total_amount')::NUMERIC
  )
  RETURNING id INTO v_receipt_id;

  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO yarn_receipt_items (
      receipt_id, yarn_type, color_name, unit, quantity, unit_price,
      lot_number, tensile_strength, composition, origin, yarn_catalog_id, sort_order
    )
    SELECT
      v_receipt_id,
      item->>'yarn_type',
      item->>'color_name',
      COALESCE(item->>'unit', 'kg'),
      (item->>'quantity')::NUMERIC,
      (item->>'unit_price')::NUMERIC,
      item->>'lot_number',
      item->>'tensile_strength',
      item->>'composition',
      item->>'origin',
      NULLIF(item->>'yarn_catalog_id', '')::UUID,
      (item->>'sort_order')::INTEGER
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  SELECT to_jsonb(t) INTO v_result FROM yarn_receipts t WHERE id = v_receipt_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
