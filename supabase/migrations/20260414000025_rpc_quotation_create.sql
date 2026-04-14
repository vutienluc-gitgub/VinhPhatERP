CREATE OR REPLACE FUNCTION atomic_create_quotation(
  p_header JSONB,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_quotation_id UUID;
  v_result JSONB;
BEGIN
  -- Insert header
  INSERT INTO quotations (
    quotation_number, customer_id, quotation_date, valid_until,
    subtotal, discount_type, discount_value, discount_amount,
    total_before_vat, vat_rate, vat_amount, total_amount,
    delivery_terms, payment_terms, notes, status
  ) VALUES (
    p_header->>'quotation_number',
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

  -- Insert items
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
