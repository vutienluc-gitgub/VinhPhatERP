-- Sửa lỗi tenant_id missing trong fn_create_order_atomic bằng auth.uid()

CREATE OR REPLACE FUNCTION public.fn_create_order_atomic(
  p_order_number VARCHAR(20),
  p_order_type VARCHAR(20),
  p_customer_id UUID,
  p_order_date DATE,
  p_delivery_date DATE,
  p_total_amount NUMERIC,
  p_status order_status,
  p_notes TEXT,
  p_source_quotation_id UUID,
  p_created_by UUID,
  p_items JSONB,
  p_allocations JSONB
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_item_id UUID;
  v_item_ids UUID[] := '{}';
  v_item JSONB;
  v_alloc JSONB;
  v_alloc_item_idx INT;
  v_alloc_roll_id UUID;
  v_alloc_meters NUMERIC;
  v_tenant UUID;
BEGIN
  -- Lấy tenant_id từ profiles của người gọi
  SELECT tenant_id INTO v_tenant FROM profiles WHERE id = auth.uid();
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'TENANT_NOT_FOUND: Không thể xác định mã chi nhánh.';
  END IF;

  -- STEP 1: Create Order
  INSERT INTO orders (
    order_number, order_type, customer_id, order_date, delivery_date,
    total_amount, status, notes, source_quotation_id, created_by, tenant_id
  )
  VALUES (
    p_order_number, COALESCE(p_order_type, 'production'), p_customer_id, p_order_date, p_delivery_date,
    p_total_amount, p_status, p_notes, p_source_quotation_id, p_created_by, v_tenant
  )
  RETURNING id INTO v_order_id;

  -- STEP 2: Create Order Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id, fabric_type, color_name, color_code, width_cm,
      unit, quantity, unit_price, notes, sort_order, tenant_id
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
      (v_item->>'sort_order')::SMALLINT,
      v_tenant
    )
    RETURNING id INTO v_item_id;

    v_item_ids := v_item_ids || v_item_id;
  END LOOP;

  -- STEP 3: FIFO allocation + mark rolls reserved
  IF p_allocations IS NOT NULL THEN
    FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_allocations)
    LOOP
      v_alloc_item_idx := (v_alloc->>'item_index')::INT;
      v_alloc_roll_id  := (v_alloc->>'roll_id')::UUID;
      v_alloc_meters   := (v_alloc->>'allocated_meters')::NUMERIC;

      v_item_id := v_item_ids[v_alloc_item_idx + 1];

      INSERT INTO order_lot_allocations (order_id, order_item_id, roll_id, allocated_meters, tenant_id)
      VALUES (v_order_id, v_item_id, v_alloc_roll_id, v_alloc_meters, v_tenant);

      UPDATE finished_fabric_rolls
      SET status = 'reserved', reserved_for_order_id = v_order_id
      WHERE id = v_alloc_roll_id AND status = 'in_stock';

      IF NOT FOUND THEN
        RAISE EXCEPTION 'CONCURRENT_RESERVATION: Roll % đã bị đặt trước bởi đơn hàng khác.', v_alloc_roll_id;
      END IF;
    END LOOP;
  END IF;

  -- STEP 4: Update customer pending debt
  UPDATE customers
  SET current_debt = current_debt + p_total_amount
  WHERE id = p_customer_id;

  -- STEP 5: Write audit log
  INSERT INTO business_audit_log (event_type, entity_type, entity_id, user_id, payload, tenant_id)
  VALUES (
    'ORDER_CREATED', 'order', v_order_id, p_created_by,
    jsonb_build_object(
      'order_number',        p_order_number,
      'customer_id',         p_customer_id,
      'total_amount',        p_total_amount,
      'order_type',          COALESCE(p_order_type, 'production'),
      'reserved_rolls_count', COALESCE(jsonb_array_length(p_allocations), 0)
    ),
    v_tenant
  );

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
