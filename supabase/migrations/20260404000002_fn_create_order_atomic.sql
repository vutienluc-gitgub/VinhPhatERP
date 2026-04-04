CREATE OR REPLACE FUNCTION fn_create_order_atomic(
  p_order_number        TEXT,
  p_customer_id         UUID,
  p_order_date          DATE,
  p_delivery_date       DATE,
  p_total_amount        NUMERIC(18,2),
  p_notes               TEXT,
  p_source_quotation_id UUID,
  p_created_by          UUID,
  p_items               JSONB,
  p_allocations         JSONB,
  p_manager_override    BOOLEAN,
  p_override_user_id    UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id       UUID;
  v_item           JSONB;
  v_item_ids       UUID[];
  v_item_id        UUID;
  v_alloc          JSONB;
  v_alloc_item_idx INT;
  v_alloc_roll_id  UUID;
  v_alloc_meters   NUMERIC(14,3);
BEGIN

  -- STEP 1: Insert order header
  INSERT INTO orders (
    order_number, customer_id, order_date, delivery_date,
    total_amount, status, notes, source_quotation_id, created_by
  )
  VALUES (
    p_order_number, p_customer_id, p_order_date, p_delivery_date,
    p_total_amount, 'draft', p_notes, p_source_quotation_id, p_created_by
  )
  RETURNING id INTO v_order_id;

  -- STEP 2: Insert order_items, collect IDs in order
  v_item_ids := ARRAY[]::UUID[];

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id, fabric_type, color_name, color_code, width_cm,
      unit, quantity, unit_price, notes, sort_order
    )
    VALUES (
      v_order_id,
      v_item->>'fabric_type',
      NULLIF(v_item->>'color_name', ''),
      NULLIF(v_item->>'color_code', ''),
      NULLIF(v_item->>'width_cm', '')::NUMERIC,
      COALESCE(v_item->>'unit', 'm'),
      (v_item->>'quantity')::NUMERIC,
      (v_item->>'unit_price')::NUMERIC,
      NULLIF(v_item->>'notes', ''),
      (v_item->>'sort_order')::SMALLINT
    )
    RETURNING id INTO v_item_id;

    v_item_ids := v_item_ids || v_item_id;
  END LOOP;

  -- STEP 3: FIFO allocation + mark rolls reserved
  FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_allocations)
  LOOP
    v_alloc_item_idx := (v_alloc->>'item_index')::INT;
    v_alloc_roll_id  := (v_alloc->>'roll_id')::UUID;
    v_alloc_meters   := (v_alloc->>'allocated_meters')::NUMERIC;

    v_item_id := v_item_ids[v_alloc_item_idx + 1];

    INSERT INTO order_lot_allocations (order_id, order_item_id, roll_id, allocated_meters)
    VALUES (v_order_id, v_item_id, v_alloc_roll_id, v_alloc_meters);

    UPDATE finished_fabric_rolls
    SET status = 'reserved', reserved_for_order_id = v_order_id
    WHERE id = v_alloc_roll_id AND status = 'in_stock';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'CONCURRENT_RESERVATION: Roll % đã bị đặt trước bởi đơn hàng khác.', v_alloc_roll_id;
    END IF;
  END LOOP;

  -- STEP 4: Update customer pending debt
  UPDATE customers
  SET current_debt = current_debt + p_total_amount
  WHERE id = p_customer_id;

  -- STEP 5: Write audit log
  INSERT INTO business_audit_log (event_type, entity_type, entity_id, user_id, payload)
  VALUES (
    'ORDER_CREATED', 'order', v_order_id, p_created_by,
    jsonb_build_object(
      'order_number',        p_order_number,
      'customer_id',         p_customer_id,
      'total_amount',        p_total_amount,
      'item_count',          jsonb_array_length(p_items),
      'allocation_count',    jsonb_array_length(p_allocations),
      'manager_override',    p_manager_override,
      'override_user_id',    p_override_user_id,
      'source_quotation_id', p_source_quotation_id
    )
  );

  -- STEP 6: Mark quotation as converted (if applicable)
  IF p_source_quotation_id IS NOT NULL THEN
    UPDATE quotations
    SET status = 'converted', converted_order_id = v_order_id, confirmed_at = NOW()
    WHERE id = p_source_quotation_id AND status IN ('confirmed', 'sent');
  END IF;

  RETURN jsonb_build_object('order_id', v_order_id);

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$
