CREATE OR REPLACE FUNCTION atomic_update_bom(
  p_bom_id UUID,
  p_header JSONB,
  p_items JSONB
) RETURNS VOID AS $$
BEGIN
  -- Only allow if draft
  IF NOT EXISTS (SELECT 1 FROM bom_templates WHERE id = p_bom_id AND status = 'draft') THEN
    RAISE EXCEPTION 'BOM_NOT_DRAFT: Cannot update BOM unless it is in draft status';
  END IF;

  -- Update header
  UPDATE bom_templates
  SET
    code = p_header->>'code',
    name = p_header->>'name',
    target_fabric_id = (p_header->>'target_fabric_id')::UUID,
    target_width_cm = (p_header->>'target_width_cm')::NUMERIC,
    target_gsm = (p_header->>'target_gsm')::NUMERIC,
    standard_loss_pct = COALESCE((p_header->>'standard_loss_pct')::NUMERIC, 0),
    notes = p_header->>'notes',
    updated_at = NOW()
  WHERE id = p_bom_id;

  -- Replace items
  DELETE FROM bom_yarn_items WHERE bom_template_id = p_bom_id;

  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO bom_yarn_items (
      bom_template_id, version, yarn_catalog_id, ratio_pct,
      consumption_kg_per_m, notes, sort_order
    )
    SELECT
      p_bom_id,
      1,
      (item->>'yarn_catalog_id')::UUID,
      (item->>'ratio_pct')::NUMERIC,
      (item->>'consumption_kg_per_m')::NUMERIC,
      item->>'notes',
      (item->>'sort_order')::INTEGER
    FROM jsonb_array_elements(p_items) AS item;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
