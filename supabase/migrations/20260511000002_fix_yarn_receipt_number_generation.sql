-- Migration: Fix receipt_number generation in rpc_create_yarn_receipt
-- Restores the generate_next_doc_number logic that was dropped in 20260508135809

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
BEGIN
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
    (p_header->>'tenant_id')::UUID,
    p_header->>'vehicle_info',
    COALESCE(p_header->'additional_fees', '[]'::jsonb)
  )
  RETURNING id INTO v_receipt_id;

  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO yarn_receipt_items (
      receipt_id, yarn_type, color_name, unit, quantity, unit_price,
      lot_number, grade, tensile_strength, composition, origin, yarn_catalog_id, sort_order,
      allocated_cost, landed_price
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
      (item->>'unit_price')::NUMERIC + CASE WHEN v_total_qty > 0 THEN (v_total_fees / v_total_qty) ELSE 0 END
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  SELECT to_jsonb(t) INTO v_result FROM yarn_receipts t WHERE id = v_receipt_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
