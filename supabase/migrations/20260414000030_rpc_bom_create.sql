CREATE OR REPLACE FUNCTION atomic_create_bom(
  p_header JSONB,
  p_items JSONB,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_bom_id UUID;
  v_result JSONB;
BEGIN
  -- Insert header
  INSERT INTO bom_templates (
    code, name, target_fabric_id, target_width_cm, target_gsm,
    standard_loss_pct, notes, status, active_version, created_by
  ) VALUES (
    p_header->>'code',
    p_header->>'name',
    (p_header->>'target_fabric_id')::UUID,
    (p_header->>'target_width_cm')::NUMERIC,
    (p_header->>'target_gsm')::NUMERIC,
    COALESCE((p_header->>'standard_loss_pct')::NUMERIC, 0),
    p_header->>'notes',
    'draft',
    1,
    p_user_id
  )
  RETURNING id INTO v_bom_id;

  -- Insert items
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO bom_yarn_items (
      bom_template_id, version, yarn_catalog_id, ratio_pct,
      consumption_kg_per_m, notes, sort_order
    )
    SELECT
      v_bom_id,
      1,
      (item->>'yarn_catalog_id')::UUID,
      (item->>'ratio_pct')::NUMERIC,
      (item->>'consumption_kg_per_m')::NUMERIC,
      item->>'notes',
      (item->>'sort_order')::INTEGER
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  SELECT to_jsonb(t) INTO v_result FROM bom_templates t WHERE id = v_bom_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
