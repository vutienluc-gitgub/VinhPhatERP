-- ============================================================
-- RPC: complete_dyeing_order
-- Atomic: mark complete + create finished rolls + update raw status
-- ============================================================

CREATE OR REPLACE FUNCTION complete_dyeing_order(
  p_dyeing_order_id UUID,
  p_actual_return_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID
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

  IF v_order.status NOT IN ('sent', 'in_progress') THEN
    RAISE EXCEPTION 'DYEING_ORDER_INVALID_STATUS: %', v_order.status;
  END IF;

  -- Get tenant_id from order
  v_tenant := v_order.tenant_id;

  -- Build roll number prefix from order number
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

    -- 2a. Create finished fabric roll
    INSERT INTO finished_fabric_rolls (
      roll_number,
      raw_roll_id,
      fabric_type,
      color_name,
      color_code,
      width_cm,
      length_m,
      weight_kg,
      quality_grade,
      status,
      production_date,
      notes,
      tenant_id
    ) VALUES (
      v_roll_prefix || lpad(v_counter::TEXT, 2, '0'),
      v_item.raw_fabric_roll_id,
      v_item.fabric_type,
      v_item.color_name,
      v_item.color_code,
      v_item.width_cm,
      v_item.length_m,        -- sẽ được cập nhật thực tế sau nếu cần
      v_item.weight_kg,
      v_item.quality_grade,
      'in_stock',
      p_actual_return_date,
      'Từ lệnh nhuộm ' || v_order.dyeing_order_number,
      v_tenant
    )
    RETURNING id INTO v_finished_id;

    -- 2b. Link finished roll back to dyeing item
    UPDATE dyeing_order_items
    SET finished_fabric_roll_id = v_finished_id
    WHERE id = v_item.id;

    -- 2c. Mark raw roll as processed (no longer in_stock)
    UPDATE raw_fabric_rolls
    SET status = 'in_process'
    WHERE id = v_item.raw_fabric_roll_id
      AND status = 'in_stock';
  END LOOP;

  -- 3. Update dyeing order status
  UPDATE dyeing_orders
  SET status = 'completed',
      actual_return_date = p_actual_return_date
  WHERE id = p_dyeing_order_id;

  -- 4. Sync order_progress if linked to work_order → order
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
