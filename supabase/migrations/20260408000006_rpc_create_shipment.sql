-- 0. DROP EXISTING TO CHANGE RETURN TYPE
DROP FUNCTION IF EXISTS create_shipment_from_finished_fabric(uuid, uuid[], date, numeric);

CREATE OR REPLACE FUNCTION create_shipment_from_finished_fabric(
  p_customer_id UUID,
  p_roll_ids UUID[],
  p_shipment_date DATE DEFAULT CURRENT_DATE,
  p_price_per_meter NUMERIC(14,2) DEFAULT 0
) RETURNS TABLE (
  shipment_id UUID,
  rolls_count INT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shipment_id UUID;
  v_tenant UUID;
  v_next_number TEXT;
  v_prefix TEXT;
  v_valid_count INT;
BEGIN
  -- 1. AUTH & TENANT CHECK
  SELECT tenant_id INTO v_tenant FROM public.profiles WHERE id = auth.uid();
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACCESS';
  END IF;

  -- 2. ANTI-RACE CONDITION & VALIDATION (SELECT FOR UPDATE)
  -- Khóa các roll được chọn để update, đảm bảo không bị xuất đồng thời ở session khác
  PERFORM 1 
  FROM public.finished_fabric_rolls 
  WHERE id = ANY(p_roll_ids) 
    AND tenant_id = v_tenant
    AND status = 'in_stock'
  FOR UPDATE;

  -- Kiểm tra số lượng roll thực tế khả dụng so với yêu cầu
  SELECT COUNT(*) INTO v_valid_count 
  FROM public.finished_fabric_rolls 
  WHERE id = ANY(p_roll_ids) 
    AND tenant_id = v_tenant 
    AND status = 'in_stock';

  IF v_valid_count IS NULL OR v_valid_count != array_length(p_roll_ids, 1) THEN
    RAISE EXCEPTION 'SOME_ROLLS_NOT_AVAILABLE_OR_INVALID_STATUS';
  END IF;

  -- 3. GENERATE SHIPMENT NUMBER (XKYYMM-XXXX)
  v_prefix := 'XK' || to_char(p_shipment_date, 'YYMM') || '-';
  SELECT v_prefix || lpad(COALESCE(MAX(SUBSTRING(shipment_number FROM 8 FOR 4))::INT + 1, 1)::TEXT, 4, '0')
  INTO v_next_number
  FROM public.shipments
  WHERE shipment_number LIKE v_prefix || '%' AND tenant_id = v_tenant;

  -- 4. INSERT SHIPMENT HEADER
  INSERT INTO public.shipments (
    shipment_number,
    customer_id,
    shipment_date,
    status,
    tenant_id,
    created_by
  ) VALUES (
    v_next_number,
    p_customer_id,
    p_shipment_date,
    'preparing',
    v_tenant,
    auth.uid()
  ) RETURNING id INTO v_shipment_id;

  -- 5. INSERT SHIPMENT ITEMS
  INSERT INTO public.shipment_items (
    shipment_id, 
    finished_roll_id, 
    fabric_type, 
    color_name, 
    quantity, 
    unit, 
    tenant_id,
    price_per_meter
  )
  SELECT 
    v_shipment_id, 
    r.id, 
    r.fabric_type, 
    r.color_name, 
    r.length_m,
    'm', 
    v_tenant,
    p_price_per_meter
  FROM public.finished_fabric_rolls r
  WHERE r.id = ANY(p_roll_ids);

  -- 6. UPDATE ROLLS STATUS
  UPDATE public.finished_fabric_rolls
  SET status = 'shipped',
      updated_at = now()
  WHERE id = ANY(p_roll_ids);

  -- 7. AUDIT LOG: INVENTORY MOVEMENTS ('decrease' for out)
  INSERT INTO public.inventory_movements (
    tenant_id,
    finished_roll_id,
    movement_type,
    quantity,
    unit,
    reference_id,
    reference_type,
    notes,
    created_by
  )
  SELECT 
    v_tenant,
    r.id,
    'decrease', 
    r.length_m,
    'm',
    v_shipment_id,
    'shipment',
    'Xuất kho thành phẩm theo phiếu ' || v_next_number,
    auth.uid()
  FROM public.finished_fabric_rolls r
  WHERE r.id = ANY(p_roll_ids);

  -- 8. RETURN RESULTS
  RETURN QUERY SELECT v_shipment_id, v_valid_count;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;
