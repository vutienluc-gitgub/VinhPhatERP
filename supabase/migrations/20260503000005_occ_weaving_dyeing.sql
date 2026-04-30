-- Migration: Add Optimistic Concurrency Control (OCC) to Weaving and Dyeing RPCs

-- 1. Weaving Invoices OCC
DROP FUNCTION IF EXISTS public.rpc_update_weaving_invoice;
CREATE OR REPLACE FUNCTION public.rpc_update_weaving_invoice(
  p_id UUID,
  p_header JSONB,
  p_rolls JSONB,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id UUID;
  v_total_weight NUMERIC;
  v_total_amount NUMERIC;
  v_invoice_number TEXT;
  v_current_updated_at TIMESTAMPTZ;
BEGIN
  -- Optimistic Concurrency Control (OCC) Guard
  IF p_expected_updated_at IS NOT NULL THEN
    SELECT updated_at INTO v_current_updated_at
    FROM weaving_invoices WHERE id = p_id FOR UPDATE;

    IF date_trunc('milliseconds', v_current_updated_at) != date_trunc('milliseconds', p_expected_updated_at) THEN
      RAISE EXCEPTION 'OCC_MISMATCH: Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.';
    END IF;
  END IF;

  -- Verify ownership and status
  SELECT tenant_id, invoice_number INTO v_tenant_id, v_invoice_number
  FROM weaving_invoices 
  WHERE id = p_id AND status = 'draft';

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'INVOICE_NOT_DRAFT: Only draft invoices can be updated';
  END IF;

  -- 1. Update Header
  UPDATE weaving_invoices
  SET 
    invoice_number = COALESCE(p_header->>'invoice_number', invoice_number),
    supplier_id = COALESCE((p_header->>'supplier_id')::UUID, supplier_id),
    invoice_date = COALESCE((p_header->>'invoice_date')::DATE, invoice_date),
    fabric_type = COALESCE(p_header->>'fabric_type', fabric_type),
    unit_price_per_kg = COALESCE((p_header->>'unit_price_per_kg')::NUMERIC, unit_price_per_kg),
    notes = p_header->>'notes',
    updated_at = now()
  WHERE id = p_id;

  -- 2. Delete existing items
  DELETE FROM weaving_invoice_items WHERE invoice_id = p_id;

  -- 3. Insert new items
  IF jsonb_array_length(p_rolls) > 0 THEN
    INSERT INTO weaving_invoice_items (
      invoice_id, roll_number, weight_kg, length_m, 
      quality_grade, warehouse_location, lot_number, notes, sort_order
    )
    SELECT 
      p_id,
      item->>'roll_number',
      (item->>'weight_kg')::NUMERIC,
      (item->>'length_m')::NUMERIC,
      item->>'quality_grade',
      item->>'warehouse_location',
      item->>'lot_number',
      item->>'notes',
      (item->>'sort_order')::INTEGER
    FROM jsonb_array_elements(p_rolls) AS item;
  END IF;

  -- 4. Recalculate Totals
  SELECT COALESCE(SUM(weight_kg), 0) INTO v_total_weight
  FROM weaving_invoice_items WHERE invoice_id = p_id;

  v_total_amount := v_total_weight * COALESCE((p_header->>'unit_price_per_kg')::NUMERIC, 0);

  UPDATE weaving_invoices
  SET total_weight_kg = v_total_weight, total_amount = v_total_amount
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_update_weaving_invoice TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_update_weaving_invoice TO service_role;


-- 2. Dyeing Orders OCC
DROP FUNCTION IF EXISTS public.rpc_update_dyeing_order;
CREATE OR REPLACE FUNCTION public.rpc_update_dyeing_order(
  p_id UUID,
  p_header JSONB,
  p_items JSONB,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_total_weight NUMERIC;
  v_total_amount NUMERIC;
  v_unit_price NUMERIC;
  v_current_updated_at TIMESTAMPTZ;
BEGIN
  -- Optimistic Concurrency Control (OCC) Guard
  IF p_expected_updated_at IS NOT NULL THEN
    SELECT updated_at INTO v_current_updated_at
    FROM dyeing_orders WHERE id = p_id FOR UPDATE;

    IF date_trunc('milliseconds', v_current_updated_at) != date_trunc('milliseconds', p_expected_updated_at) THEN
      RAISE EXCEPTION 'OCC_MISMATCH: Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.';
    END IF;
  END IF;

  -- Guard: only draft can be updated
  IF NOT EXISTS (SELECT 1 FROM dyeing_orders WHERE id = p_id AND status = 'draft') THEN
    RAISE EXCEPTION 'DYEING_ORDER_NOT_DRAFT: Cannot update a non-draft dyeing order';
  END IF;

  -- Update header
  UPDATE dyeing_orders
  SET
    dyeing_order_number = COALESCE(p_header->>'dyeing_order_number', dyeing_order_number),
    supplier_id = COALESCE((p_header->>'supplier_id')::UUID, supplier_id),
    order_date = COALESCE((p_header->>'order_date')::DATE, order_date),
    expected_return_date = CASE
      WHEN p_header ? 'expected_return_date' THEN NULLIF(p_header->>'expected_return_date', '')::DATE
      ELSE expected_return_date
    END,
    unit_price_per_kg = COALESCE((p_header->>'unit_price_per_kg')::NUMERIC, unit_price_per_kg),
    work_order_id = CASE
      WHEN p_header ? 'work_order_id' THEN NULLIF(p_header->>'work_order_id', '')::UUID
      ELSE work_order_id
    END,
    notes = CASE
      WHEN p_header ? 'notes' THEN NULLIF(p_header->>'notes', '')
      ELSE notes
    END,
    updated_at = now()
  WHERE id = p_id;

  -- Replace items atomically
  IF p_items IS NOT NULL THEN
    DELETE FROM dyeing_order_items WHERE dyeing_order_id = p_id;

    INSERT INTO dyeing_order_items (
      dyeing_order_id, raw_fabric_roll_id, weight_kg, length_m,
      color_name, color_code, notes, sort_order
    )
    SELECT
      p_id,
      NULLIF(item->>'raw_fabric_roll_id', '')::UUID,
      (item->>'weight_kg')::NUMERIC,
      NULLIF(item->>'length_m', '')::NUMERIC,
      item->>'color_name',
      item->>'color_code',
      item->>'notes',
      (item->>'sort_order')::INTEGER
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  -- Recalculate totals
  SELECT COALESCE(SUM(weight_kg), 0) INTO v_total_weight
  FROM dyeing_order_items WHERE dyeing_order_id = p_id;

  SELECT unit_price_per_kg INTO v_unit_price
  FROM dyeing_orders WHERE id = p_id;

  v_total_amount := v_total_weight * COALESCE(v_unit_price, 0);

  UPDATE dyeing_orders
  SET total_weight_kg = v_total_weight, total_amount = v_total_amount
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.rpc_update_dyeing_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_update_dyeing_order TO service_role;
