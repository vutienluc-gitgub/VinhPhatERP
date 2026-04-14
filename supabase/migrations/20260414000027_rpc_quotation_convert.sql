CREATE OR REPLACE FUNCTION atomic_convert_quotation_to_order(
  p_quotation_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_q RECORD;
  v_prefix TEXT;
  v_next_val INTEGER;
  v_order_number TEXT;
  v_order_id UUID;
  v_combined_notes TEXT;
BEGIN
  -- Read quotation
  SELECT * INTO v_q FROM quotations WHERE id = p_quotation_id;
  IF v_q.id IS NULL THEN
    RAISE EXCEPTION 'QUOTATION_NOT_FOUND: Quotation does not exist';
  END IF;
  IF v_q.status != 'confirmed' THEN
    RAISE EXCEPTION 'QUOTATION_NOT_CONFIRMED: Only confirmed quotations can be converted';
  END IF;

  -- Generate next order number
  v_prefix := 'DH' || TO_CHAR(CURRENT_DATE, 'YYMM') || '-';
  
  -- Use pg_try_advisory_xact_lock to prevent race conditions on number generation?
  -- Instead, we just rely on locking the max row if we have one.
  SELECT SUBSTRING(order_number FROM '\d{4}$')::INTEGER
  INTO v_next_val
  FROM orders
  WHERE order_number ILIKE v_prefix || '%'
  ORDER BY order_number DESC
  LIMIT 1;

  IF v_next_val IS NULL THEN
    v_next_val := 1;
  ELSE
    v_next_val := v_next_val + 1;
  END IF;

  v_order_number := v_prefix || LPAD(v_next_val::TEXT, 4, '0');

  -- Combine notes
  v_combined_notes := 'Từ BG: ' || COALESCE(v_q.quotation_number, '');
  IF v_q.delivery_terms IS NOT NULL AND v_q.delivery_terms != '' THEN 
    v_combined_notes := v_combined_notes || '. Giao hàng: ' || v_q.delivery_terms; 
  END IF;
  IF v_q.payment_terms IS NOT NULL AND v_q.payment_terms != '' THEN 
    v_combined_notes := v_combined_notes || '. Thanh toán: ' || v_q.payment_terms; 
  END IF;
  IF v_q.notes IS NOT NULL AND v_q.notes != '' THEN 
    v_combined_notes := v_combined_notes || '. Ghi chú: ' || v_q.notes; 
  END IF;

  -- Insert order
  INSERT INTO orders (
    order_number, 
    customer_id, 
    order_date, 
    total_amount, 
    source_quotation_id, 
    notes, 
    status
  ) VALUES (
    v_order_number, 
    v_q.customer_id, 
    CURRENT_DATE, 
    v_q.total_amount, 
    p_quotation_id, 
    v_combined_notes, 
    'draft'
  ) RETURNING id INTO v_order_id;

  -- Insert items
  INSERT INTO order_items (
    order_id, 
    fabric_type, 
    color_name, 
    color_code, 
    width_cm, 
    unit, 
    quantity, 
    unit_price, 
    sort_order
  )
  SELECT
    v_order_id, 
    fabric_type, 
    color_name, 
    color_code, 
    width_cm, 
    unit, 
    quantity, 
    unit_price, 
    sort_order
  FROM quotation_items
  WHERE quotation_id = p_quotation_id;

  -- Update quotation status
  UPDATE quotations 
  SET status = 'converted', converted_order_id = v_order_id 
  WHERE id = p_quotation_id;

  RETURN jsonb_build_object('orderId', v_order_id, 'orderNumber', v_order_number);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
