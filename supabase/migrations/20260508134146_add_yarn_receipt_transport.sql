-- Add inbound logistics (transport) fields to yarn_receipts
ALTER TABLE yarn_receipts
ADD COLUMN vehicle_info text,
ADD COLUMN additional_fees JSONB DEFAULT '[]'::jsonb;

-- Update Create RPC
CREATE OR REPLACE FUNCTION rpc_create_yarn_receipt(
  p_header JSONB,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_receipt_id UUID;
  v_result JSONB;
BEGIN
  INSERT INTO yarn_receipts (
    receipt_number, supplier_id, receipt_date, notes, status, total_amount, tenant_id,
    vehicle_info, additional_fees
  ) VALUES (
    p_header->>'receipt_number',
    (p_header->>'supplier_id')::UUID,
    (p_header->>'receipt_date')::DATE,
    p_header->>'notes',
    COALESCE(p_header->>'status', 'draft')::doc_status,
    (p_header->>'total_amount')::NUMERIC,
    (p_header->>'tenant_id')::UUID,
    p_header->>'vehicle_info',
    COALESCE(p_header->'additional_fees', '[]'::jsonb)
  )
  RETURNING id INTO v_receipt_id;

  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO yarn_receipt_items (
      receipt_id, yarn_type, color_name, unit, quantity, unit_price,
      lot_number, grade, tensile_strength, composition, origin, yarn_catalog_id, sort_order
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
      (item->>'sort_order')::INTEGER
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  SELECT to_jsonb(t) INTO v_result FROM yarn_receipts t WHERE id = v_receipt_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Update RPC
CREATE OR REPLACE FUNCTION rpc_update_yarn_receipt(
  p_id UUID,
  p_header JSONB,
  p_items JSONB,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_current_updated_at TIMESTAMPTZ;
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

  UPDATE yarn_receipts
  SET
    receipt_number = COALESCE(p_header->>'receipt_number', receipt_number),
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
      lot_number, grade, tensile_strength, composition, origin, yarn_catalog_id, sort_order
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
      (item->>'sort_order')::INTEGER
    FROM jsonb_array_elements(p_items) AS item;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
