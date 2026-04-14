CREATE OR REPLACE FUNCTION atomic_update_quotation(
  p_quotation_id UUID,
  p_header JSONB,
  p_items JSONB
) RETURNS VOID AS $$
BEGIN
  -- Only allow if draft
  IF NOT EXISTS (SELECT 1 FROM quotations WHERE id = p_quotation_id AND status = 'draft') THEN
    RAISE EXCEPTION 'QUOTATION_NOT_DRAFT: Cannot update quotation unless it is in draft status';
  END IF;

  -- Update header
  UPDATE quotations
  SET
    quotation_number = p_header->>'quotation_number',
    customer_id = (p_header->>'customer_id')::UUID,
    quotation_date = (p_header->>'quotation_date')::DATE,
    valid_until = (p_header->>'valid_until')::DATE,
    subtotal = COALESCE((p_header->>'subtotal')::NUMERIC, 0),
    discount_type = p_header->>'discount_type',
    discount_value = COALESCE((p_header->>'discount_value')::NUMERIC, 0),
    discount_amount = COALESCE((p_header->>'discount_amount')::NUMERIC, 0),
    total_before_vat = COALESCE((p_header->>'total_before_vat')::NUMERIC, 0),
    vat_rate = COALESCE((p_header->>'vat_rate')::NUMERIC, 0),
    vat_amount = COALESCE((p_header->>'vat_amount')::NUMERIC, 0),
    total_amount = COALESCE((p_header->>'total_amount')::NUMERIC, 0),
    delivery_terms = p_header->>'delivery_terms',
    payment_terms = p_header->>'payment_terms',
    notes = p_header->>'notes',
    updated_at = NOW()
  WHERE id = p_quotation_id;

  -- Replace items
  DELETE FROM quotation_items WHERE quotation_id = p_quotation_id;

  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO quotation_items (
      quotation_id, fabric_type, color_name, color_code,
      width_cm, unit, quantity, unit_price, lead_time_days, notes, sort_order
    )
    SELECT
      p_quotation_id,
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
