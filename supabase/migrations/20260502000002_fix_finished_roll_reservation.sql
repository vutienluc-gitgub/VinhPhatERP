-- =====================================================================================
-- Migration: Fix Finished Fabric Roll Reservation Race Condition
-- =====================================================================================

-- Bổ sung hàm RPC để giữ chỗ cuộn vải nguyên chiếc (atomic & an toàn)
CREATE OR REPLACE FUNCTION rpc_reserve_finished_roll(
  p_roll_id UUID,
  p_order_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status text;
  v_tenant uuid;
BEGIN
  -- 1. Lấy tenant hiện tại để chống lộ dữ liệu chéo
  SELECT tenant_id INTO v_tenant FROM profiles WHERE id = auth.uid();
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACCESS';
  END IF;

  -- 2. Lock row để tránh Race Condition (SELECT FOR UPDATE)
  SELECT status INTO v_status
  FROM finished_fabric_rolls
  WHERE id = p_roll_id AND tenant_id = v_tenant
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ROLL_NOT_FOUND';
  END IF;

  IF v_status != 'in_stock' THEN
    RAISE EXCEPTION 'ROLL_ALREADY_RESERVED_OR_UNAVAILABLE';
  END IF;

  -- 3. Thực hiện update một khi đã lấy được lock
  UPDATE finished_fabric_rolls
  SET status = 'reserved',
      reserved_for_order_id = p_order_id,
      updated_at = now()
  WHERE id = p_roll_id;
END;
$$;
