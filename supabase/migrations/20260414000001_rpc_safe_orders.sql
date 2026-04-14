-- Migration to add atomic safe RPCs for order updating and confirming

CREATE OR REPLACE FUNCTION update_order_with_items(
  p_order_id UUID,
  p_header_data JSONB,
  p_items_data JSONB
) RETURNS VOID AS $$
BEGIN
  -- Update header dynamically from JSONB, skipping null keys
  UPDATE orders
  SET 
    customer_id = COALESCE((p_header_data->>'customer_id')::UUID, customer_id),
    order_date = COALESCE((p_header_data->>'order_date')::DATE, order_date),
    delivery_date = COALESCE((p_header_data->>'delivery_date')::DATE, delivery_date),
    notes = COALESCE(p_header_data->>'notes', notes),
    status = COALESCE((p_header_data->>'status')::order_status, status)
  WHERE id = p_order_id;

  -- Atomic Replace Items
  DELETE FROM order_items WHERE order_id = p_order_id;

  INSERT INTO order_items (
    order_id,
    finished_fabric_id,
    quantity,
    unit_price,
    notes
  )
  SELECT
    p_order_id,
    (item->>'finished_fabric_id')::UUID,
    (item->>'quantity')::NUMERIC,
    (item->>'unit_price')::NUMERIC,
    item->>'notes'
  FROM jsonb_array_elements(p_items_data) AS item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION confirm_order(
  p_order_id UUID
) RETURNS VOID AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  -- Recalculate total accurately from items
  SELECT COALESCE(SUM(quantity * unit_price), 0)
  INTO v_total
  FROM order_items
  WHERE order_id = p_order_id;

  -- Update status and total to confirmed (Lock draft to preventing double confirm)
  UPDATE orders
  SET 
    status = 'confirmed',
    total_amount = v_total
  WHERE id = p_order_id AND status = 'draft';

  -- If the update was successful (it was truly in draft)
  IF FOUND THEN
    INSERT INTO order_progress (order_id, stage, status)
    VALUES
      (p_order_id, 'warping', 'pending'),
      (p_order_id, 'weaving', 'pending'),
      (p_order_id, 'greige_check', 'pending'),
      (p_order_id, 'dyeing', 'pending'),
      (p_order_id, 'finishing', 'pending'),
      (p_order_id, 'final_check', 'pending'),
      (p_order_id, 'packing', 'pending');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
