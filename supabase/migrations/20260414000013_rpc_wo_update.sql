CREATE OR REPLACE FUNCTION atomic_update_work_order(
  p_wo_id UUID,
  p_wo_data JSONB,
  p_reqs_data JSONB
) RETURNS VOID AS $$
BEGIN
  UPDATE work_orders
  SET
    work_order_number = COALESCE(NULLIF(p_wo_data->>'work_order_number', ''), work_order_number),
    order_id = CASE WHEN p_wo_data->>'order_id' = 'none' THEN NULL ELSE COALESCE(NULLIF(p_wo_data->>'order_id', '')::UUID, order_id) END,
    bom_template_id = COALESCE(NULLIF(p_wo_data->>'bom_template_id', '')::UUID, bom_template_id),
    bom_version = COALESCE((p_wo_data->>'bom_version')::INTEGER, bom_version),
    target_quantity_m = COALESCE((p_wo_data->>'target_quantity_m')::NUMERIC, target_quantity_m),
    target_unit = COALESCE(NULLIF(p_wo_data->>'target_unit', ''), target_unit),
    target_weight_kg = COALESCE((p_wo_data->>'target_weight_kg')::NUMERIC, target_weight_kg),
    standard_loss_pct = COALESCE((p_wo_data->>'standard_loss_pct')::NUMERIC, standard_loss_pct),
    start_date = CASE WHEN (p_wo_data->>'start_date') IS NOT NULL AND (p_wo_data->>'start_date') = '' THEN NULL ELSE COALESCE(NULLIF(p_wo_data->>'start_date', '')::DATE, start_date) END,
    end_date = CASE WHEN (p_wo_data->>'end_date') IS NOT NULL AND (p_wo_data->>'end_date') = '' THEN NULL ELSE COALESCE(NULLIF(p_wo_data->>'end_date', '')::DATE, end_date) END,
    supplier_id = COALESCE(NULLIF(p_wo_data->>'supplier_id', '')::UUID, supplier_id),
    weaving_unit_price = COALESCE((p_wo_data->>'weaving_unit_price')::NUMERIC, weaving_unit_price),
    notes = CASE WHEN (p_wo_data->>'notes') IS NOT NULL AND (p_wo_data->>'notes') = '' THEN NULL ELSE COALESCE(CASE WHEN jsonb_typeof(p_wo_data->'notes') = 'null' THEN NULL ELSE p_wo_data->>'notes' END, notes) END
  WHERE id = p_wo_id;

  IF p_reqs_data IS NOT NULL THEN
    DELETE FROM work_order_y_requirements WHERE work_order_id = p_wo_id;
    
    INSERT INTO work_order_y_requirements (
      work_order_id, yarn_catalog_id, bom_ratio_pct, required_kg, allocated_kg
    )
    SELECT
      p_wo_id,
      (req->>'yarn_catalog_id')::UUID,
      (req->>'bom_ratio_pct')::NUMERIC,
      (req->>'required_kg')::NUMERIC,
      (req->>'allocated_kg')::NUMERIC
    FROM jsonb_array_elements(p_reqs_data) AS req;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
