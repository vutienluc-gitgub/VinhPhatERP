CREATE OR REPLACE FUNCTION atomic_cancel_order(
  p_order_id UUID
) RETURNS VOID AS $$
BEGIN
  -- 1. Release all reserved rolls back to in_stock
  UPDATE finished_fabric_rolls
  SET 
    status = 'in_stock',
    reserved_for_order_id = NULL
  WHERE reserved_for_order_id = p_order_id 
    AND status = 'reserved';

  -- 2. Cancel the order
  UPDATE orders 
  SET status = 'cancelled'::order_status 
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
