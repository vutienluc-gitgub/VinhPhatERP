CREATE OR REPLACE FUNCTION atomic_create_dyeing_order(
  p_header JSONB,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_total_weight NUMERIC;
  v_total_amount NUMERIC;
  v_result JSONB;
BEGIN
  -- Insert header
  INSERT INTO dyeing_orders (
    dyeing_order_number, supplier_id, order_date, expected_return_date,
    unit_price_per_kg, work_order_id, notes, status, created_by
  ) VALUES (
    p_header->>'dyeing_order_number',
    (p_header->>'supplier_id')::UUID,
    (p_header->>'order_date')::DATE,
    NULLIF(p_header->>'expected_return_date', '')::DATE,
    (p_header->>'unit_price_per_kg')::NUMERIC,
    NULLIF(p_header->>'work_order_id', '')::UUID,
    p_header->>'notes',
    COALESCE(p_header->>'status', 'draft')::dyeing_order_status,
    NULLIF(p_header->>'created_by', '')::UUID
  )
  RETURNING id INTO v_order_id;

  -- Insert items
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO dyeing_order_items (
      dyeing_order_id, raw_fabric_roll_id, weight_kg, length_m,
      color_name, color_code, notes, sort_order
    )
    SELECT
      v_order_id,
      NULLIF(item->>'raw_fabric_roll_id', '')::UUID,
      (item->>'weight_kg')::NUMERIC,
      NULLIF(item->>'length_m', '')::NUMERIC,
      item->>'color_name',
      item->>'color_code',
      item->>'notes',
      (item->>'sort_order')::INTEGER
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  -- Recalculate totals
  SELECT COALESCE(SUM(weight_kg), 0) INTO v_total_weight
  FROM dyeing_order_items WHERE dyeing_order_id = v_order_id;

  v_total_amount := v_total_weight * COALESCE((p_header->>'unit_price_per_kg')::NUMERIC, 0);

  UPDATE dyeing_orders
  SET total_weight_kg = v_total_weight, total_amount = v_total_amount
  WHERE id = v_order_id;

  SELECT to_jsonb(t) INTO v_result FROM dyeing_orders t WHERE id = v_order_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
