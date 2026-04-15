-- =============================================================================
-- Migration: Embed doc number generation INSIDE atomic_create_* RPCs
-- This ensures number generation and INSERT happen in the SAME transaction,
-- completely eliminating race conditions.
-- =============================================================================

-- ─── 1. Yarn Receipts ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION atomic_create_yarn_receipt(
  p_header JSONB,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_receipt_id UUID;
  v_receipt_number TEXT;
  v_result JSONB;
BEGIN
  -- Generate number atomically (advisory lock inside same transaction)
  v_receipt_number := generate_next_doc_number(
    'yarn_receipts', 'receipt_number', 'NS-', 3
  );

  INSERT INTO yarn_receipts (
    receipt_number, supplier_id, receipt_date, notes, status, total_amount
  ) VALUES (
    v_receipt_number,
    (p_header->>'supplier_id')::UUID,
    (p_header->>'receipt_date')::DATE,
    p_header->>'notes',
    COALESCE(p_header->>'status', 'draft')::doc_status,
    (p_header->>'total_amount')::NUMERIC
  )
  RETURNING id INTO v_receipt_id;

  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO yarn_receipt_items (
      receipt_id, yarn_type, color_name, unit, quantity, unit_price,
      lot_number, tensile_strength, composition, origin, yarn_catalog_id, sort_order
    )
    SELECT
      v_receipt_id,
      item->>'yarn_type',
      item->>'color_name',
      COALESCE(item->>'unit', 'kg'),
      (item->>'quantity')::NUMERIC,
      (item->>'unit_price')::NUMERIC,
      item->>'lot_number',
      item->>'tensile_strength',
      item->>'composition',
      item->>'origin',
      NULLIF(item->>'yarn_catalog_id', '')::UUID,
      (item->>'sort_order')::INTEGER
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  SELECT to_jsonb(t) INTO v_result FROM yarn_receipts t WHERE id = v_receipt_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 2. Orders ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION atomic_create_order(
  p_header JSONB,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_result JSONB;
BEGIN
  v_order_number := generate_next_doc_number(
    'orders', 'order_number', 'DH' || to_char(now(), 'YYMM') || '-', 4
  );

  INSERT INTO orders (
    order_number, customer_id, order_date, delivery_date,
    total_amount, source_quotation_id, notes, status
  ) VALUES (
    v_order_number,
    (p_header->>'customer_id')::UUID,
    COALESCE((p_header->>'order_date')::DATE, CURRENT_DATE),
    (p_header->>'delivery_date')::DATE,
    COALESCE((p_header->>'total_amount')::NUMERIC, 0),
    NULLIF(p_header->>'source_quotation_id', '')::UUID,
    p_header->>'notes',
    COALESCE((p_header->>'status')::order_status, 'draft'::order_status)
  )
  RETURNING id INTO v_order_id;

  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO order_items (
      order_id, finished_fabric_id, fabric_type, color_name, color_code,
      width_cm, unit, quantity, unit_price, notes, sort_order
    )
    SELECT
      v_order_id,
      NULLIF(item->>'finished_fabric_id', '')::UUID,
      item->>'fabric_type',
      item->>'color_name',
      item->>'color_code',
      (item->>'width_cm')::NUMERIC,
      COALESCE(item->>'unit', 'kg'),
      (item->>'quantity')::NUMERIC,
      (item->>'unit_price')::NUMERIC,
      item->>'notes',
      COALESCE((item->>'sort_order')::INTEGER, 0)
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  SELECT to_jsonb(t) INTO v_result FROM orders t WHERE id = v_order_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 3. Quotations ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION atomic_create_quotation(
  p_header JSONB,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_quotation_id UUID;
  v_quotation_number TEXT;
  v_result JSONB;
BEGIN
  v_quotation_number := generate_next_doc_number(
    'quotations', 'quotation_number', 'BG' || to_char(now(), 'YYMM') || '-', 4
  );

  INSERT INTO quotations (
    quotation_number, customer_id, quotation_date, valid_until,
    subtotal, discount_type, discount_value, discount_amount,
    total_before_vat, vat_rate, vat_amount, total_amount,
    delivery_terms, payment_terms, notes, status
  ) VALUES (
    v_quotation_number,
    (p_header->>'customer_id')::UUID,
    (p_header->>'quotation_date')::DATE,
    (p_header->>'valid_until')::DATE,
    COALESCE((p_header->>'subtotal')::NUMERIC, 0),
    p_header->>'discount_type',
    COALESCE((p_header->>'discount_value')::NUMERIC, 0),
    COALESCE((p_header->>'discount_amount')::NUMERIC, 0),
    COALESCE((p_header->>'total_before_vat')::NUMERIC, 0),
    COALESCE((p_header->>'vat_rate')::NUMERIC, 0),
    COALESCE((p_header->>'vat_amount')::NUMERIC, 0),
    COALESCE((p_header->>'total_amount')::NUMERIC, 0),
    p_header->>'delivery_terms',
    p_header->>'payment_terms',
    p_header->>'notes',
    'draft'
  )
  RETURNING id INTO v_quotation_id;

  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO quotation_items (
      quotation_id, fabric_type, color_name, color_code,
      width_cm, unit, quantity, unit_price, lead_time_days, notes, sort_order
    )
    SELECT
      v_quotation_id,
      item->>'fabric_type',
      item->>'color_name',
      item->>'color_code',
      (item->>'width_cm')::NUMERIC,
      COALESCE(item->>'unit', 'kg'),
      (item->>'quantity')::NUMERIC,
      (item->>'unit_price')::NUMERIC,
      (item->>'lead_time_days')::INTEGER,
      item->>'notes',
      (item->>'sort_order')::INTEGER
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  SELECT to_jsonb(t) INTO v_result FROM quotations t WHERE id = v_quotation_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 4. Shipments ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION atomic_create_shipment(
  p_header JSONB,
  p_items JSONB,
  p_reserve_roll_ids UUID[]
) RETURNS JSONB AS $$
DECLARE
  v_shipment_id UUID;
  v_shipment_number TEXT;
  v_result JSONB;
BEGIN
  -- Validate rolls
  IF array_length(p_reserve_roll_ids, 1) > 0 THEN
    IF EXISTS (
      SELECT 1 FROM unnest(p_reserve_roll_ids) AS rid
      WHERE NOT EXISTS (
        SELECT 1 FROM finished_fabric_rolls
        WHERE id = rid AND status IN ('in_stock', 'reserved')
      )
    ) THEN
      RAISE EXCEPTION 'ROLL_NOT_AVAILABLE: One or more rolls are not available for shipment';
    END IF;
  END IF;

  v_shipment_number := generate_next_doc_number(
    'shipments', 'shipment_number', 'XK' || to_char(now(), 'YYMM') || '-', 4
  );

  INSERT INTO shipments (
    shipment_number, order_id, customer_id, shipment_date,
    delivery_address, delivery_staff_id, employee_id,
    shipping_rate_id, shipping_cost, loading_fee, vehicle_info,
    status
  ) VALUES (
    v_shipment_number,
    NULLIF(p_header->>'order_id', '')::UUID,
    (p_header->>'customer_id')::UUID,
    (p_header->>'shipment_date')::DATE,
    p_header->>'delivery_address',
    NULLIF(p_header->>'delivery_staff_id', '')::UUID,
    NULLIF(p_header->>'employee_id', '')::UUID,
    NULLIF(p_header->>'shipping_rate_id', '')::UUID,
    COALESCE((p_header->>'shipping_cost')::NUMERIC, 0),
    COALESCE((p_header->>'loading_fee')::NUMERIC, 0),
    p_header->>'vehicle_info',
    'preparing'::shipment_status
  )
  RETURNING id INTO v_shipment_id;

  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO shipment_items (
      shipment_id, finished_roll_id, fabric_type, color_name,
      quantity, unit, sort_order
    )
    SELECT
      v_shipment_id,
      NULLIF(item->>'finished_roll_id', '')::UUID,
      item->>'fabric_type',
      item->>'color_name',
      (item->>'quantity')::NUMERIC,
      COALESCE(item->>'unit', 'kg'),
      (item->>'sort_order')::INTEGER
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  IF array_length(p_reserve_roll_ids, 1) > 0 THEN
    UPDATE finished_fabric_rolls
    SET status = 'reserved',
        reserved_for_order_id = NULLIF(p_header->>'order_id', '')::UUID
    WHERE id = ANY(p_reserve_roll_ids);
  END IF;

  SELECT to_jsonb(t) INTO v_result FROM shipments t WHERE id = v_shipment_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 5. Dyeing Orders ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION atomic_create_dyeing_order(
  p_header JSONB,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_total_weight NUMERIC;
  v_total_amount NUMERIC;
  v_result JSONB;
BEGIN
  v_order_number := generate_next_doc_number(
    'dyeing_orders', 'dyeing_order_number', 'DN' || to_char(now(), 'YYMM') || '-', 4
  );

  INSERT INTO dyeing_orders (
    dyeing_order_number, supplier_id, order_date, expected_return_date,
    unit_price_per_kg, work_order_id, notes, status, created_by
  ) VALUES (
    v_order_number,
    (p_header->>'supplier_id')::UUID,
    (p_header->>'order_date')::DATE,
    NULLIF(p_header->>'expected_return_date', '')::DATE,
    (p_header->>'unit_price_per_kg')::NUMERIC,
    NULLIF(p_header->>'work_order_id', '')::UUID,
    p_header->>'notes',
    COALESCE(p_header->>'status', 'draft')::dyeing_order_status,
    NULLIF(p_header->>'created_by', '')::UUID
  )
  RETURNING id INTO v_order_id;

  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO dyeing_order_items (
      dyeing_order_id, raw_fabric_roll_id, weight_kg, length_m,
      color_name, color_code, notes, sort_order
    )
    SELECT
      v_order_id,
      NULLIF(item->>'raw_fabric_roll_id', '')::UUID,
      (item->>'weight_kg')::NUMERIC,
      NULLIF(item->>'length_m', '')::NUMERIC,
      item->>'color_name',
      item->>'color_code',
      item->>'notes',
      (item->>'sort_order')::INTEGER
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  SELECT COALESCE(SUM(weight_kg), 0) INTO v_total_weight
  FROM dyeing_order_items WHERE dyeing_order_id = v_order_id;

  v_total_amount := v_total_weight * COALESCE((p_header->>'unit_price_per_kg')::NUMERIC, 0);

  UPDATE dyeing_orders
  SET total_weight_kg = v_total_weight, total_amount = v_total_amount
  WHERE id = v_order_id;

  SELECT to_jsonb(t) INTO v_result FROM dyeing_orders t WHERE id = v_order_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 6. Weaving Invoices ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION atomic_create_weaving_invoice(
  p_header JSONB,
  p_rolls JSONB
) RETURNS JSONB AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_total_weight NUMERIC;
  v_total_amount NUMERIC;
  v_result JSONB;
BEGIN
  v_invoice_number := generate_next_doc_number(
    'weaving_invoices', 'invoice_number', 'GC' || to_char(now(), 'YYMM') || '-', 3
  );

  INSERT INTO weaving_invoices (
    invoice_number, supplier_id, invoice_date, fabric_type,
    unit_price_per_kg, notes, status, created_by
  ) VALUES (
    v_invoice_number,
    (p_header->>'supplier_id')::UUID,
    (p_header->>'invoice_date')::DATE,
    p_header->>'fabric_type',
    (p_header->>'unit_price_per_kg')::NUMERIC,
    p_header->>'notes',
    COALESCE(p_header->>'status', 'draft'),
    NULLIF(p_header->>'created_by', '')::UUID
  )
  RETURNING id INTO v_invoice_id;

  IF p_rolls IS NOT NULL AND jsonb_array_length(p_rolls) > 0 THEN
    INSERT INTO weaving_invoice_rolls (
      invoice_id, roll_number, weight_kg, length_m,
      quality_grade, warehouse_location, lot_number, notes, sort_order
    )
    SELECT
      v_invoice_id,
      r->>'roll_number',
      (r->>'weight_kg')::NUMERIC,
      NULLIF(r->>'length_m', '')::NUMERIC,
      r->>'quality_grade',
      r->>'warehouse_location',
      r->>'lot_number',
      r->>'notes',
      (r->>'sort_order')::INTEGER
    FROM jsonb_array_elements(p_rolls) AS r;
  END IF;

  SELECT COALESCE(SUM(weight_kg), 0) INTO v_total_weight
  FROM weaving_invoice_rolls WHERE invoice_id = v_invoice_id;

  v_total_amount := v_total_weight * (p_header->>'unit_price_per_kg')::NUMERIC;

  UPDATE weaving_invoices
  SET total_weight_kg = v_total_weight, total_amount = v_total_amount
  WHERE id = v_invoice_id;

  SELECT to_jsonb(t) INTO v_result FROM weaving_invoices t WHERE id = v_invoice_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 7. Payments (new RPC, previously used direct insert) ─────────────────────
CREATE OR REPLACE FUNCTION atomic_create_payment(
  p_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_payment_number TEXT;
  v_result JSONB;
BEGIN
  v_payment_number := generate_next_doc_number(
    'payments', 'payment_number', 'TT' || to_char(now(), 'YYMM') || '-', 4
  );

  INSERT INTO payments (
    payment_number, order_id, customer_id, payment_date,
    amount, payment_method, account_id, reference_number
  ) VALUES (
    v_payment_number,
    (p_data->>'order_id')::UUID,
    (p_data->>'customer_id')::UUID,
    (p_data->>'payment_date')::DATE,
    (p_data->>'amount')::NUMERIC,
    (p_data->>'payment_method')::payment_method,
    NULLIF(p_data->>'account_id', '')::UUID,
    p_data->>'reference_number'
  );

  SELECT to_jsonb(t) INTO v_result
  FROM payments t
  WHERE t.payment_number = v_payment_number;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION atomic_create_payment(JSONB) TO authenticated;


-- ─── 8. Expenses (new RPC, previously used direct insert) ─────────────────────
CREATE OR REPLACE FUNCTION atomic_create_expense(
  p_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_expense_number TEXT;
  v_result JSONB;
BEGIN
  v_expense_number := generate_next_doc_number(
    'expenses', 'expense_number', 'PC' || to_char(now(), 'YYMM') || '-', 4
  );

  INSERT INTO expenses (
    expense_number, category, amount, expense_date,
    account_id, supplier_id, employee_id,
    description, reference_number, notes
  ) VALUES (
    v_expense_number,
    (p_data->>'category')::expense_category,
    (p_data->>'amount')::NUMERIC,
    (p_data->>'expense_date')::DATE,
    NULLIF(p_data->>'account_id', '')::UUID,
    NULLIF(p_data->>'supplier_id', '')::UUID,
    NULLIF(p_data->>'employee_id', '')::UUID,
    p_data->>'description',
    p_data->>'reference_number',
    p_data->>'notes'
  );

  SELECT to_jsonb(t) INTO v_result
  FROM expenses t
  WHERE t.expense_number = v_expense_number;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION atomic_create_expense(JSONB) TO authenticated;
