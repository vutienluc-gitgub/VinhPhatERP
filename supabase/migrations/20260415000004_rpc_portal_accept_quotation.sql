-- =============================================================================
-- Migration: Create RPC for Portal Quotation Acceptance
-- Purpose: Atomically update quotation status and create a pending_review Sales Order.
-- This ensures the "Quote-to-Customer" loop completes safely without race conditions.
-- =============================================================================

CREATE OR REPLACE FUNCTION rpc_portal_accept_quotation(
  p_quotation_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_q RECORD;
  v_order_number TEXT;
  v_order_id UUID;
  v_combined_notes TEXT;
BEGIN
  -- Read and Lock quotation
  SELECT * INTO v_q FROM quotations WHERE id = p_quotation_id FOR UPDATE;
  IF v_q.id IS NULL THEN
    RAISE EXCEPTION 'QUOTATION_NOT_FOUND: Báo giá không tồn tại';
  END IF;
  
  -- Prevent multiple conversion or invalid states
  IF v_q.status = 'confirmed' OR v_q.status = 'converted' THEN
    RAISE EXCEPTION 'QUOTATION_ALREADY_ACCEPTED: Báo giá này đã được chấp nhận';
  END IF;

  IF v_q.status != 'sent' THEN
    RAISE EXCEPTION 'QUOTATION_INVALID_STATE: Báo giá không ở trạng thái chờ duyệt';
  END IF;

  -- Ensure valid_until check
  IF v_q.valid_until IS NOT NULL AND v_q.valid_until < CURRENT_DATE THEN
    RAISE EXCEPTION 'QUOTATION_EXPIRED: Báo giá đã hết hạn, vui lòng liên hệ Sale để nhận báo giá mới';
  END IF;

  -- Generate next order number using the atomic fn
  v_order_number := generate_next_doc_number(
    'orders', 'order_number', 'DH' || to_char(now(), 'YYMM') || '-', 4
  );

  -- Combine notes
  v_combined_notes := 'Tạo tự động từ Báo giá: ' || COALESCE(v_q.quotation_number, '');
  IF v_q.notes IS NOT NULL AND v_q.notes != '' THEN 
    v_combined_notes := v_combined_notes || '. Ghi chú báo giá: ' || v_q.notes; 
  END IF;

  -- Insert order with status pending_review
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
    'pending_review'
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

  -- Update quotation status to confirmed
  UPDATE quotations 
  SET status = 'confirmed', confirmed_at = NOW(), converted_order_id = v_order_id 
  WHERE id = p_quotation_id;

  RETURN jsonb_build_object('success', true, 'orderId', v_order_id, 'orderNumber', v_order_number);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION rpc_portal_accept_quotation(UUID) TO authenticated;
