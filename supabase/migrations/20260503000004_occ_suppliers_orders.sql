-- Migration: Add Optimistic Concurrency Control (OCC) to Core RPCs
-- Adds expected_updated_at parameters to prevent "Lost Update" anomalies

-- 1. Update Supplier RPC
DROP FUNCTION IF EXISTS public.rpc_update_supplier;
CREATE OR REPLACE FUNCTION public.rpc_update_supplier(
    p_id UUID,
    p_code TEXT,
    p_name TEXT,
    p_category supplier_category,
    p_phone TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_tax_code TEXT DEFAULT NULL,
    p_contact_person TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_status active_status DEFAULT 'active',
    p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_role user_role;
    v_result UUID;
    v_current_updated_at TIMESTAMPTZ;
BEGIN
    -- Check authentication
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
    
    -- Check authorization
    SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
    IF v_role IS NULL OR v_role NOT IN ('admin', 'manager', 'staff') THEN 
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    -- Optimistic Concurrency Control (OCC) Guard
    IF p_expected_updated_at IS NOT NULL THEN
        SELECT updated_at INTO v_current_updated_at
        FROM suppliers WHERE id = p_id FOR UPDATE;

        IF date_trunc('milliseconds', v_current_updated_at) != date_trunc('milliseconds', p_expected_updated_at) THEN
            RAISE EXCEPTION 'OCC_MISMATCH: Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.';
        END IF;
    END IF;

    -- Perform the update
    UPDATE suppliers
    SET code = p_code,
        name = p_name,
        category = p_category,
        phone = p_phone,
        email = p_email,
        address = p_address,
        tax_code = p_tax_code,
        contact_person = p_contact_person,
        notes = p_notes,
        status = p_status,
        updated_at = now()
    WHERE id = p_id
    RETURNING id INTO v_result;

    IF v_result IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
    
    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_update_supplier TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_update_supplier TO service_role;


-- 2. Update Order With Items RPC
DROP FUNCTION IF EXISTS public.rpc_update_order_with_items;
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

GRANT EXECUTE ON FUNCTION public.rpc_update_order_with_items TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_update_order_with_items TO service_role;
