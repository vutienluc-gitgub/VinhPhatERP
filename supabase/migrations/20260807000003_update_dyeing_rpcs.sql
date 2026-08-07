-- ========================================================================================
-- 3. Update rpc_create_dyeing_order and rpc_update_dyeing_order to use roll_allocations
-- ========================================================================================

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
  v_tenant UUID;
  v_total_weight NUMERIC;
  v_total_amount NUMERIC;
  v_result JSONB;
  v_roll_ids UUID[];
BEGIN
  -- Lấy tenant_id từ profiles của người gọi
  SELECT tenant_id INTO v_tenant FROM profiles WHERE id = auth.uid();
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'TENANT_NOT_FOUND: Không thể xác định mã chi nhánh.';
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
    -- Extract roll IDs
    SELECT array_agg(NULLIF(item->>'raw_fabric_roll_id', '')::UUID) INTO v_roll_ids
    FROM jsonb_array_elements(p_items) AS item 
    WHERE item->>'raw_fabric_roll_id' IS NOT NULL AND item->>'raw_fabric_roll_id' != '';

    -- Validate and allocate rolls via the central allocation engine
    -- This handles pessimistic locking and duplicate prevention
    PERFORM public.rpc_allocate_rolls(
      v_roll_ids,
      'dyeing_order',
      v_order_id,
      auth.uid()
    );

    -- Insert items
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
    
    -- NOTE: We NO LONGER update raw_fabric_rolls.status to 'reserved' here.
    -- The allocation table is the single source of truth for reservations.
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
