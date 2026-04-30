-- =====================================================================================
-- Migration: Fix Inventory Race Conditions (TOCTOU & Phantom Reads)
-- Vá lỗi Lệch Tồn Kho cho xuất kho (shipments) và nhuộm (dyeing_orders)
-- =====================================================================================

-- 1. Fix rpc_create_shipment to lock rolls BEFORE checking availability
CREATE OR REPLACE FUNCTION public.rpc_create_shipment(
  p_header JSONB,
  p_items JSONB,
  p_reserve_roll_ids UUID[]
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shipment_id UUID;
  v_shipment_number TEXT;
  v_tenant UUID := current_tenant_id();
  v_result JSONB;
BEGIN
  IF array_length(p_reserve_roll_ids, 1) > 0 THEN
    -- LOCK ROW (Chống Race Condition)
    PERFORM 1 FROM finished_fabric_rolls
    WHERE id = ANY(p_reserve_roll_ids)
    FOR UPDATE;

    -- KIỂM TRA TỒN KHO SAU KHI ĐÃ LOCK
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

  v_shipment_number := generate_next_doc_number(
    'shipments', 'shipment_number', 'XK' || to_char(now(), 'YYMM') || '-', 4
  );

  INSERT INTO shipments (
    shipment_number, order_id, customer_id, shipment_date,
    delivery_address, delivery_staff_id, employee_id,
    shipping_rate_id, shipping_cost, loading_fee, vehicle_info,
    status, tenant_id
  ) VALUES (
    v_shipment_number,
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
    'preparing'::shipment_status,
    v_tenant
  )
  RETURNING id INTO v_shipment_id;

  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO shipment_items (
      shipment_id, finished_roll_id, fabric_type, color_name,
      quantity, unit, sort_order, tenant_id
    )
    SELECT
      v_shipment_id,
      NULLIF(item->>'finished_roll_id', '')::UUID,
      item->>'fabric_type',
      item->>'color_name',
      (item->>'quantity')::NUMERIC,
      COALESCE(item->>'unit', 'kg'),
      (item->>'sort_order')::INTEGER,
      v_tenant
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  IF array_length(p_reserve_roll_ids, 1) > 0 THEN
    UPDATE finished_fabric_rolls
    SET status = 'reserved',
        reserved_for_order_id = NULLIF(p_header->>'order_id', '')::UUID
    WHERE id = ANY(p_reserve_roll_ids);
  END IF;

  SELECT to_jsonb(t) INTO v_result FROM shipments t WHERE id = v_shipment_id;
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_create_shipment(JSONB, JSONB, UUID[]) TO authenticated;

-- 2. Fix rpc_create_dyeing_order to lock and reserve raw_fabric_rolls
CREATE OR REPLACE FUNCTION public.rpc_create_dyeing_order(
  p_header JSONB,
  p_items JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_tenant UUID := current_tenant_id();
  v_total_weight NUMERIC;
  v_total_amount NUMERIC;
  v_result JSONB;
BEGIN
  -- LOCK RAW ROLLS & RESERVE THEM
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    -- Lock row
    PERFORM 1 FROM raw_fabric_rolls
    WHERE id IN (
      SELECT NULLIF(item->>'raw_fabric_roll_id', '')::UUID 
      FROM jsonb_array_elements(p_items) AS item 
      WHERE item->>'raw_fabric_roll_id' IS NOT NULL AND item->>'raw_fabric_roll_id' != ''
    )
    FOR UPDATE;

    -- Verify availability
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_items) AS item
      WHERE item->>'raw_fabric_roll_id' IS NOT NULL AND item->>'raw_fabric_roll_id' != ''
      AND NOT EXISTS (
        SELECT 1 FROM raw_fabric_rolls
        WHERE id = (item->>'raw_fabric_roll_id')::UUID AND status = 'in_stock'
      )
    ) THEN
      RAISE EXCEPTION 'RAW_ROLL_NOT_AVAILABLE: Một hoặc nhiều cuộn mộc đã được sử dụng.';
    END IF;
  END IF;

  v_order_number := generate_next_doc_number(
    'dyeing_orders', 'dyeing_order_number', 'DN' || to_char(now(), 'YYMM') || '-', 4
  );

  INSERT INTO dyeing_orders (
    dyeing_order_number, supplier_id, order_date, expected_return_date,
    unit_price_per_kg, work_order_id, notes, status, created_by, tenant_id
  ) VALUES (
    v_order_number,
    (p_header->>'supplier_id')::UUID,
    (p_header->>'order_date')::DATE,
    NULLIF(p_header->>'expected_return_date', '')::DATE,
    (p_header->>'unit_price_per_kg')::NUMERIC,
    NULLIF(p_header->>'work_order_id', '')::UUID,
    p_header->>'notes',
    COALESCE(p_header->>'status', 'draft')::dyeing_order_status,
    NULLIF(p_header->>'created_by', '')::UUID,
    v_tenant
  )
  RETURNING id INTO v_order_id;

  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO dyeing_order_items (
      dyeing_order_id, raw_fabric_roll_id, weight_kg, length_m,
      color_name, color_code, notes, sort_order, tenant_id
    )
    SELECT
      v_order_id,
      NULLIF(item->>'raw_fabric_roll_id', '')::UUID,
      (item->>'weight_kg')::NUMERIC,
      NULLIF(item->>'length_m', '')::NUMERIC,
      item->>'color_name',
      item->>'color_code',
      item->>'notes',
      (item->>'sort_order')::INTEGER,
      v_tenant
    FROM jsonb_array_elements(p_items) AS item;

    -- Reserve raw rolls
    UPDATE raw_fabric_rolls
    SET status = 'reserved'
    WHERE id IN (
      SELECT NULLIF(item->>'raw_fabric_roll_id', '')::UUID 
      FROM jsonb_array_elements(p_items) AS item 
      WHERE item->>'raw_fabric_roll_id' IS NOT NULL AND item->>'raw_fabric_roll_id' != ''
    );
  END IF;

  SELECT COALESCE(SUM(weight_kg), 0) INTO v_total_weight
  FROM dyeing_order_items WHERE dyeing_order_id = v_order_id;

  v_total_amount := v_total_weight * COALESCE((p_header->>'unit_price_per_kg')::NUMERIC, 0);

  UPDATE dyeing_orders
  SET total_weight_kg = v_total_weight, total_amount = v_total_amount
  WHERE id = v_order_id;

  SELECT to_jsonb(t) INTO v_result FROM dyeing_orders t WHERE id = v_order_id;
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_create_dyeing_order(JSONB, JSONB) TO authenticated;

-- 3. Fix rpc_complete_dyeing_order to safely mark reserved raw rolls as in_process
CREATE OR REPLACE FUNCTION public.rpc_complete_dyeing_order(
  p_dyeing_order_id UUID,
  p_actual_return_date DATE DEFAULT CURRENT_DATE
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_finished_id UUID;
  v_roll_prefix TEXT;
  v_counter INT := 0;
  v_tenant UUID;
BEGIN
  -- 1. Lock and validate the dyeing order
  SELECT * INTO v_order
  FROM dyeing_orders
  WHERE id = p_dyeing_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'DYEING_ORDER_NOT_FOUND';
  END IF;

  IF v_order.status = 'completed' THEN
    RAISE EXCEPTION 'DYEING_ORDER_ALREADY_COMPLETED';
  END IF;

  IF v_order.status NOT IN ('sent', 'in_progress', 'draft') THEN
    RAISE EXCEPTION 'DYEING_ORDER_INVALID_STATUS: %', v_order.status;
  END IF;

  v_tenant := v_order.tenant_id;
  v_roll_prefix := 'TP-' || v_order.dyeing_order_number || '-';

  -- 2. Loop through items → create finished rolls
  FOR v_item IN
    SELECT doi.*, rfr.fabric_type, rfr.width_cm, rfr.quality_grade
    FROM dyeing_order_items doi
    JOIN raw_fabric_rolls rfr ON rfr.id = doi.raw_fabric_roll_id
    WHERE doi.dyeing_order_id = p_dyeing_order_id
    ORDER BY doi.sort_order
  LOOP
    v_counter := v_counter + 1;

    INSERT INTO finished_fabric_rolls (
      roll_number, raw_roll_id, fabric_type, color_name, color_code,
      width_cm, length_m, weight_kg, quality_grade, status, production_date, notes, tenant_id
    ) VALUES (
      v_roll_prefix || lpad(v_counter::TEXT, 2, '0'),
      v_item.raw_fabric_roll_id, v_item.fabric_type, v_item.color_name, v_item.color_code,
      v_item.width_cm, v_item.length_m, v_item.weight_kg, v_item.quality_grade,
      'in_stock', p_actual_return_date, 'Từ lệnh nhuộm ' || v_order.dyeing_order_number, v_tenant
    )
    RETURNING id INTO v_finished_id;

    UPDATE dyeing_order_items
    SET finished_fabric_roll_id = v_finished_id
    WHERE id = v_item.id;

    -- 2c. Mark raw roll as processed (It was reserved during create)
    UPDATE raw_fabric_rolls
    SET status = 'in_process'
    WHERE id = v_item.raw_fabric_roll_id
      AND status IN ('in_stock', 'reserved');
  END LOOP;

  -- 3. Update dyeing order status
  UPDATE dyeing_orders
  SET status = 'completed',
      actual_return_date = p_actual_return_date
  WHERE id = p_dyeing_order_id;

  -- 4. Sync order_progress
  IF v_order.work_order_id IS NOT NULL THEN
    UPDATE order_progress
    SET status = 'done',
        actual_date = p_actual_return_date::TEXT
    WHERE stage = 'dyeing'
      AND (
        order_id IN (SELECT order_id FROM work_orders WHERE id = v_order.work_order_id)
        OR work_order_id = v_order.work_order_id
      )
      AND status != 'done';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_complete_dyeing_order(UUID, DATE) TO authenticated;
