CREATE OR REPLACE FUNCTION atomic_update_yarn_receipt(
  p_id UUID,
  p_header JSONB,
  p_items JSONB
) RETURNS VOID AS $$
BEGIN
  UPDATE yarn_receipts
  SET
    receipt_number = COALESCE(p_header->>'receipt_number', receipt_number),
    supplier_id = COALESCE((p_header->>'supplier_id')::UUID, supplier_id),
    receipt_date = COALESCE((p_header->>'receipt_date')::DATE, receipt_date),
    notes = CASE WHEN (p_header->>'notes') IS NOT NULL AND (p_header->>'notes') = '' THEN NULL ELSE COALESCE(CASE WHEN jsonb_typeof(p_header->'notes') = 'null' THEN NULL ELSE p_header->>'notes' END, notes) END,
    total_amount = COALESCE((p_header->>'total_amount')::NUMERIC, total_amount)
  WHERE id = p_id;

  IF p_items IS NOT NULL THEN
    DELETE FROM yarn_receipt_items WHERE receipt_id = p_id;

    INSERT INTO yarn_receipt_items (
      receipt_id, yarn_type, color_name, unit, quantity, unit_price,
      lot_number, tensile_strength, composition, origin, yarn_catalog_id, sort_order
    )
    SELECT
      p_id,
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
