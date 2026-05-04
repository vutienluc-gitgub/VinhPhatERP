-- Add order_type to orders table to distinguish production vs trading orders
-- Trading orders skip production progress stages on confirmation

-- 1. Add column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'production';

-- 2. Update rpc_confirm_order to conditionally create progress stages
DROP FUNCTION IF EXISTS public.rpc_confirm_order;
CREATE OR REPLACE FUNCTION public.rpc_confirm_order(
  p_order_id UUID
) RETURNS VOID AS $$
DECLARE
  v_total NUMERIC;
  v_order_type VARCHAR(20);
BEGIN
  -- Recalculate total accurately from items
  SELECT COALESCE(SUM(quantity * unit_price), 0)
  INTO v_total
  FROM order_items
  WHERE order_id = p_order_id;

  -- Get order type
  SELECT order_type INTO v_order_type
  FROM orders
  WHERE id = p_order_id;

  -- Update status and total to confirmed (Lock draft to prevent double confirm)
  UPDATE orders
  SET 
    status = 'confirmed',
    total_amount = v_total
  WHERE id = p_order_id AND status = 'draft';

  -- Only create production progress stages for production orders
  IF FOUND AND COALESCE(v_order_type, 'production') = 'production' THEN
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

GRANT EXECUTE ON FUNCTION public.rpc_confirm_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_confirm_order TO service_role;
