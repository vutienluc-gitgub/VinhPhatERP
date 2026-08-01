-- Update rpc_create_yarn_receipt to link to goods_receipts

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
  v_source_gr_id UUID;
BEGIN
  v_tenant := (p_header->>'tenant_id')::UUID;
  IF v_tenant IS NULL THEN
    v_tenant := current_tenant_id();
  END IF;

  v_source_gr_id := NULLIF(p_header->>'source_goods_receipt_id', '')::UUID;

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
    vehicle_info, additional_fees, source_goods_receipt_id
  ) VALUES (
    v_receipt_number,
    (p_header->>'supplier_id')::UUID,
    (p_header->>'receipt_date')::DATE,
    p_header->>'notes',
    COALESCE(p_header->>'status', 'draft')::doc_status,
    (p_header->>'total_amount')::NUMERIC,
    v_tenant,
    p_header->>'vehicle_info',
    COALESCE(p_header->'additional_fees', '[]'::jsonb),
    v_source_gr_id
  )
  RETURNING id INTO v_receipt_id;

  IF v_source_gr_id IS NOT NULL THEN
    UPDATE goods_receipts SET linked_yarn_receipt_id = v_receipt_id WHERE id = v_source_gr_id;
  END IF;

  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO yarn_receipt_items (
      receipt_id, yarn_type, color_name, unit, quantity, unit_price,
      lot_number, grade, tensile_strength, composition, origin, yarn_catalog_id, sort_order,
      allocated_cost, landed_price, tenant_id,
      net_weight, gross_weight, serial_number, production_week, dist,
      cones_per_box, box_count, box_no
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
      NULLIF(item->>'dist', ''),
      NULLIF(item->>'cones_per_box', '')::SMALLINT,
      NULLIF(item->>'box_count', '')::SMALLINT,
      NULLIF(item->>'box_no', '')
    FROM jsonb_array_elements(p_items) WITH ORDINALITY AS arr(item, idx);
  END IF;

  SELECT row_to_json(r)::jsonb INTO v_result
  FROM yarn_receipts r
  WHERE r.id = v_receipt_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
