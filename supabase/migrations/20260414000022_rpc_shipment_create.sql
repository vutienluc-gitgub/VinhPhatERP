CREATE OR REPLACE FUNCTION atomic_create_shipment(
  p_header JSONB,
  p_items JSONB,
  p_reserve_roll_ids UUID[]
) RETURNS JSONB AS $$
DECLARE
  v_shipment_id UUID;
  v_result JSONB;
BEGIN
  -- Validate: all selected rolls must be in_stock or reserved
  IF array_length(p_reserve_roll_ids, 1) > 0 THEN
    IF EXISTS (
      SELECT 1 FROM unnest(p_reserve_roll_ids) AS rid
      WHERE NOT EXISTS (
        SELECT 1 FROM finished_fabric_rolls
        WHERE id = rid AND status IN ('in_stock', 'reserved')
      )
    ) THEN
      RAISE EXCEPTION 'ROLL_NOT_AVAILABLE: One or more rolls are not available for shipment';
    END IF;
  END IF;

  -- Insert header
  INSERT INTO shipments (
    shipment_number, order_id, customer_id, shipment_date,
    delivery_address, delivery_staff_id, employee_id,
    shipping_rate_id, shipping_cost, loading_fee, vehicle_info,
    status
  ) VALUES (
    p_header->>'shipment_number',
    NULLIF(p_header->>'order_id', '')::UUID,
    (p_header->>'customer_id')::UUID,
    (p_header->>'shipment_date')::DATE,
    p_header->>'delivery_address',
    NULLIF(p_header->>'delivery_staff_id', '')::UUID,
    NULLIF(p_header->>'employee_id', '')::UUID,
    NULLIF(p_header->>'shipping_rate_id', '')::UUID,
    COALESCE((p_header->>'shipping_cost')::NUMERIC, 0),
    COALESCE((p_header->>'loading_fee')::NUMERIC, 0),
    p_header->>'vehicle_info',
    'preparing'::shipment_status
  )
  RETURNING id INTO v_shipment_id;

  -- Insert items
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO shipment_items (
      shipment_id, finished_roll_id, fabric_type, color_name,
      quantity, unit, sort_order
    )
    SELECT
      v_shipment_id,
      NULLIF(item->>'finished_roll_id', '')::UUID,
      item->>'fabric_type',
      item->>'color_name',
      (item->>'quantity')::NUMERIC,
      COALESCE(item->>'unit', 'kg'),
      (item->>'sort_order')::INTEGER
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  -- Reserve rolls atomically
  IF array_length(p_reserve_roll_ids, 1) > 0 THEN
    UPDATE finished_fabric_rolls
    SET status = 'reserved',
        reserved_for_order_id = NULLIF(p_header->>'order_id', '')::UUID
    WHERE id = ANY(p_reserve_roll_ids);
  END IF;

  SELECT to_jsonb(t) INTO v_result FROM shipments t WHERE id = v_shipment_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
