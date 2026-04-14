CREATE OR REPLACE FUNCTION atomic_create_order(
  p_header JSONB,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_result JSONB;
BEGIN
  -- Insert header
  INSERT INTO orders (
    order_number, customer_id, order_date, delivery_date,
    total_amount, source_quotation_id, notes, status
  ) VALUES (
    p_header->>'order_number',
    (p_header->>'customer_id')::UUID,
    COALESCE((p_header->>'order_date')::DATE, CURRENT_DATE),
    (p_header->>'delivery_date')::DATE,
    COALESCE((p_header->>'total_amount')::NUMERIC, 0),
    NULLIF(p_header->>'source_quotation_id', '')::UUID,
    p_header->>'notes',
    COALESCE((p_header->>'status')::order_status, 'draft'::order_status)
  )
  RETURNING id INTO v_order_id;

  -- Insert items
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO order_items (
      order_id, finished_fabric_id, fabric_type, color_name, color_code,
      width_cm, unit, quantity, unit_price, notes, sort_order
    )
    SELECT
      v_order_id,
      NULLIF(item->>'finished_fabric_id', '')::UUID,
      item->>'fabric_type',
      item->>'color_name',
      item->>'color_code',
      (item->>'width_cm')::NUMERIC,
      COALESCE(item->>'unit', 'kg'),
      (item->>'quantity')::NUMERIC,
      (item->>'unit_price')::NUMERIC,
      item->>'notes',
      COALESCE((item->>'sort_order')::INTEGER, 0)
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  SELECT to_jsonb(t) INTO v_result FROM orders t WHERE id = v_order_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
