CREATE OR REPLACE FUNCTION atomic_update_dyeing_order(
  p_id UUID,
  p_header JSONB,
  p_items JSONB
) RETURNS VOID AS $$
DECLARE
  v_total_weight NUMERIC;
  v_total_amount NUMERIC;
  v_unit_price NUMERIC;
BEGIN
  -- Guard: only draft can be updated
  IF NOT EXISTS (SELECT 1 FROM dyeing_orders WHERE id = p_id AND status = 'draft') THEN
    RAISE EXCEPTION 'DYEING_ORDER_NOT_DRAFT: Cannot update a non-draft dyeing order';
  END IF;

  -- Update header
  UPDATE dyeing_orders
  SET
    dyeing_order_number = COALESCE(p_header->>'dyeing_order_number', dyeing_order_number),
    supplier_id = COALESCE((p_header->>'supplier_id')::UUID, supplier_id),
    order_date = COALESCE((p_header->>'order_date')::DATE, order_date),
    expected_return_date = CASE
      WHEN p_header ? 'expected_return_date' THEN NULLIF(p_header->>'expected_return_date', '')::DATE
      ELSE expected_return_date
    END,
    unit_price_per_kg = COALESCE((p_header->>'unit_price_per_kg')::NUMERIC, unit_price_per_kg),
    work_order_id = CASE
      WHEN p_header ? 'work_order_id' THEN NULLIF(p_header->>'work_order_id', '')::UUID
      ELSE work_order_id
    END,
    notes = CASE
      WHEN p_header ? 'notes' THEN NULLIF(p_header->>'notes', '')
      ELSE notes
    END
  WHERE id = p_id;

  -- Replace items atomically
  IF p_items IS NOT NULL THEN
    DELETE FROM dyeing_order_items WHERE dyeing_order_id = p_id;

    INSERT INTO dyeing_order_items (
      dyeing_order_id, raw_fabric_roll_id, weight_kg, length_m,
      color_name, color_code, notes, sort_order
    )
    SELECT
      p_id,
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
  FROM dyeing_order_items WHERE dyeing_order_id = p_id;

  SELECT unit_price_per_kg INTO v_unit_price
  FROM dyeing_orders WHERE id = p_id;

  v_total_amount := v_total_weight * COALESCE(v_unit_price, 0);

  UPDATE dyeing_orders
  SET total_weight_kg = v_total_weight, total_amount = v_total_amount
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
