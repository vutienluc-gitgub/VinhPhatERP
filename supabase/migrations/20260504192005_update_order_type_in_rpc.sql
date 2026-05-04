-- Cập nhật rpc_update_order_with_items để lưu order_type khi chỉnh sửa đơn hàng

CREATE OR REPLACE FUNCTION public.rpc_update_order_with_items(
  p_order_id UUID,
  p_header_data JSONB,
  p_items_data JSONB,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_current_updated_at TIMESTAMPTZ;
BEGIN
  -- Optimistic Concurrency Control (OCC) Guard
  IF p_expected_updated_at IS NOT NULL THEN
    SELECT updated_at INTO v_current_updated_at
    FROM orders WHERE id = p_order_id FOR UPDATE;

    IF date_trunc('milliseconds', v_current_updated_at) != date_trunc('milliseconds', p_expected_updated_at) THEN
        RAISE EXCEPTION 'OCC_MISMATCH: Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.';
    END IF;
  END IF;

  -- Update header dynamically from JSONB, skipping null keys
  UPDATE orders
  SET 
    order_type = COALESCE((p_header_data->>'order_type')::VARCHAR(20), order_type),
    customer_id = COALESCE((p_header_data->>'customer_id')::UUID, customer_id),
    order_date = COALESCE((p_header_data->>'order_date')::DATE, order_date),
    delivery_date = COALESCE((p_header_data->>'delivery_date')::DATE, delivery_date),
    notes = COALESCE(p_header_data->>'notes', notes),
    status = COALESCE((p_header_data->>'status')::order_status, status),
    updated_at = now()
  WHERE id = p_order_id;

  -- Atomic Replace Items
  DELETE FROM order_items WHERE order_id = p_order_id;

  INSERT INTO order_items (
    order_id,
    fabric_type,
    color_name,
    color_code,
    width_cm,
    unit,
    quantity,
    unit_price,
    notes,
    sort_order,
    tenant_id
  )
  SELECT
    p_order_id,
    item->>'fabric_type',
    NULLIF(item->>'color_name', ''),
    NULLIF(item->>'color_code', ''),
    NULLIF(item->>'width_cm', '')::NUMERIC,
    COALESCE(item->>'unit', 'm'),
    (item->>'quantity')::NUMERIC,
    (item->>'unit_price')::NUMERIC,
    NULLIF(item->>'notes', ''),
    (item->>'sort_order')::SMALLINT,
    (SELECT tenant_id FROM orders WHERE id = p_order_id)
  FROM jsonb_array_elements(p_items_data) AS item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.rpc_update_order_with_items TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_update_order_with_items TO service_role;
