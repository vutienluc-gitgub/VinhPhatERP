-- =============================================================================
-- Fix: rpc_update_order_with_items was not updating total_amount.
-- The frontend sends total_amount in p_header_data but the UPDATE
-- statement was missing it entirely. Additionally, as a safety net,
-- we recalculate total_amount from the newly-inserted items to ensure
-- the DB is always the source of truth (not the client).
-- =============================================================================

CREATE OR REPLACE FUNCTION rpc_update_order_with_items(
  p_order_id UUID,
  p_header_data JSONB,
  p_items_data JSONB
) RETURNS VOID AS $$
DECLARE
  v_tenant UUID := current_tenant_id();
  v_total NUMERIC;
BEGIN
  -- 1. Update header fields (excluding total_amount — recalculated below)
  UPDATE orders
  SET
    customer_id   = COALESCE((p_header_data->>'customer_id')::UUID, customer_id),
    order_date    = COALESCE((p_header_data->>'order_date')::DATE, order_date),
    delivery_date = COALESCE((p_header_data->>'delivery_date')::DATE, delivery_date),
    notes         = COALESCE(p_header_data->>'notes', notes),
    status        = COALESCE((p_header_data->>'status')::order_status, status)
  WHERE id = p_order_id;

  -- 2. Atomic replace items
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

  -- 3. Recalculate total from items (DB is source of truth)
  SELECT COALESCE(SUM(quantity * unit_price), 0)
  INTO v_total
  FROM order_items
  WHERE order_id = p_order_id;

  UPDATE orders
  SET total_amount = v_total
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
