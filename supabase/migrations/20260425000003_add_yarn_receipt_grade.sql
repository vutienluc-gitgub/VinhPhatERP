-- Migration: Add grade to yarn_receipt_items and update RPCs
-- Created at: 2026-04-25

-- 1. Add column
ALTER TABLE public.yarn_receipt_items 
ADD COLUMN IF NOT EXISTS grade TEXT;

-- 2. Update Create RPC
CREATE OR REPLACE FUNCTION atomic_create_yarn_receipt(
  p_header JSONB,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_receipt_id UUID;
  v_result JSONB;
BEGIN
  INSERT INTO yarn_receipts (
    receipt_number, supplier_id, receipt_date, notes, status, total_amount
  ) VALUES (
    p_header->>'receipt_number',
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
      lot_number, grade, tensile_strength, composition, origin, yarn_catalog_id, sort_order
    )
    SELECT
      v_receipt_id,
      item->>'yarn_type',
      item->>'color_name',
      COALESCE(item->>'unit', 'kg'),
      (item->>'quantity')::NUMERIC,
      (item->>'unit_price')::NUMERIC,
      item->>'lot_number',
      item->>'grade',
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

-- 3. Update Update RPC
CREATE OR REPLACE FUNCTION atomic_update_yarn_receipt(
  p_id UUID,
  p_header JSONB,
  p_items JSONB
) RETURNS VOID AS $$
BEGIN
  UPDATE yarn_receipts
  SET
    receipt_number = COALESCE(p_header->>'receipt_number', receipt_number),
    supplier_id = COALESCE((p_header->>'supplier_id')::UUID, supplier_id),
    receipt_date = COALESCE((p_header->>'receipt_date')::DATE, receipt_date),
    notes = CASE WHEN (p_header->>'notes') IS NOT NULL AND (p_header->>'notes') = '' THEN NULL ELSE COALESCE(CASE WHEN jsonb_typeof(p_header->'notes') = 'null' THEN NULL ELSE p_header->>'notes' END, notes) END,
    total_amount = COALESCE((p_header->>'total_amount')::NUMERIC, total_amount)
  WHERE id = p_id;

  IF p_items IS NOT NULL THEN
    DELETE FROM yarn_receipt_items WHERE receipt_id = p_id;

    INSERT INTO yarn_receipt_items (
      receipt_id, yarn_type, color_name, unit, quantity, unit_price,
      lot_number, grade, tensile_strength, composition, origin, yarn_catalog_id, sort_order
    )
    SELECT
      p_id,
      item->>'yarn_type',
      item->>'color_name',
      COALESCE(item->>'unit', 'kg'),
      (item->>'quantity')::NUMERIC,
      (item->>'unit_price')::NUMERIC,
      item->>'lot_number',
      item->>'grade',
      item->>'tensile_strength',
      item->>'composition',
      item->>'origin',
      NULLIF(item->>'yarn_catalog_id', '')::UUID,
      (item->>'sort_order')::INTEGER
    FROM jsonb_array_elements(p_items) AS item;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
