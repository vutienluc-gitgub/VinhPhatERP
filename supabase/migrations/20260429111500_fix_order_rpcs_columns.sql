-- =============================================================================
-- Fix: Remove reference to non-existent "finished_fabric_id" column
-- in rpc_create_order and rpc_update_order_with_items.
--
-- The order_items table was created without finished_fabric_id,
-- but the RPCs were written assuming it existed.
-- =============================================================================

-- ─── 1. Fix rpc_update_order_with_items ──────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_update_order_with_items(
  p_order_id UUID,
  p_header_data JSONB,
  p_items_data JSONB
) RETURNS VOID AS $$
DECLARE
  v_tenant UUID := current_tenant_id();
BEGIN
  -- Update header dynamically from JSONB, skipping null keys
  UPDATE orders
  SET
    customer_id   = COALESCE((p_header_data->>'customer_id')::UUID, customer_id),
    order_date    = COALESCE((p_header_data->>'order_date')::DATE, order_date),
    delivery_date = COALESCE((p_header_data->>'delivery_date')::DATE, delivery_date),
    notes         = COALESCE(p_header_data->>'notes', notes),
    status        = COALESCE((p_header_data->>'status')::order_status, status)
  WHERE id = p_order_id;

  -- Atomic Replace Items
  DELETE FROM order_items WHERE order_id = p_order_id;

  INSERT INTO order_items (
    order_id, fabric_type, color_name, color_code,
    width_cm, unit, quantity, unit_price, notes, sort_order, tenant_id
  )
  SELECT
    p_order_id,
    item->>'fabric_type',
    item->>'color_name',
    item->>'color_code',
    (item->>'width_cm')::NUMERIC,
    COALESCE(item->>'unit', 'kg'),
    (item->>'quantity')::NUMERIC,
    (item->>'unit_price')::NUMERIC,
    item->>'notes',
    COALESCE((item->>'sort_order')::INTEGER, 0),
    v_tenant
  FROM jsonb_array_elements(p_items_data) AS item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 2. Fix rpc_create_order ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_create_order(
  p_header JSONB,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_tenant UUID := current_tenant_id();
  v_result JSONB;
BEGIN
  v_order_number := generate_next_doc_number(
    'orders', 'order_number', 'DH' || to_char(now(), 'YYMM') || '-', 4
  );

  INSERT INTO orders (
    order_number, customer_id, order_date, delivery_date,
    total_amount, source_quotation_id, notes, status, tenant_id
  ) VALUES (
    v_order_number,
    (p_header->>'customer_id')::UUID,
    COALESCE((p_header->>'order_date')::DATE, CURRENT_DATE),
    (p_header->>'delivery_date')::DATE,
    COALESCE((p_header->>'total_amount')::NUMERIC, 0),
    NULLIF(p_header->>'source_quotation_id', '')::UUID,
    p_header->>'notes',
    COALESCE((p_header->>'status')::order_status, 'draft'::order_status),
    v_tenant
  )
  RETURNING id INTO v_order_id;

  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO order_items (
      order_id, fabric_type, color_name, color_code,
      width_cm, unit, quantity, unit_price, notes, sort_order, tenant_id
    )
    SELECT
      v_order_id,
      item->>'fabric_type',
      item->>'color_name',
      item->>'color_code',
      (item->>'width_cm')::NUMERIC,
      COALESCE(item->>'unit', 'kg'),
      (item->>'quantity')::NUMERIC,
      (item->>'unit_price')::NUMERIC,
      item->>'notes',
      COALESCE((item->>'sort_order')::INTEGER, 0),
      v_tenant
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  SELECT to_jsonb(t) INTO v_result FROM orders t WHERE id = v_order_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
