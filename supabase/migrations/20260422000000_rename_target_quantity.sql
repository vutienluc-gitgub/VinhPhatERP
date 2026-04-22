
-- 1. Rename column in table
ALTER TABLE work_orders RENAME COLUMN target_quantity_m TO target_quantity;

-- 2. Update RPCs
CREATE OR REPLACE FUNCTION rpc_create_work_order(p_wo_data JSONB)
RETURNS UUID AS $$
DECLARE
  v_wo_id UUID;
  req JSONB;
BEGIN
  INSERT INTO work_orders (
    tenant_id, work_order_number, order_id, bom_template_id, bom_version, target_quantity,
    target_unit, target_weight_kg, standard_loss_pct, status, start_date,
    end_date, supplier_id, weaving_unit_price, notes
  ) VALUES (
    (p_wo_data->>'tenant_id')::UUID,
    p_wo_data->>'work_order_number',
    (p_wo_data->>'order_id')::UUID,
    (p_wo_data->>'bom_template_id')::UUID,
    (p_wo_data->>'bom_version')::INT,
    (p_wo_data->>'target_quantity')::NUMERIC,
    COALESCE(NULLIF(p_wo_data->>'target_unit', ''), 'm'),
    (p_wo_data->>'target_weight_kg')::NUMERIC,
    COALESCE((p_wo_data->>'standard_loss_pct')::NUMERIC, 5),
    COALESCE(NULLIF(p_wo_data->>'status', ''), 'draft')::order_status,
    (p_wo_data->>'start_date')::DATE,
    (p_wo_data->>'end_date')::DATE,
    (p_wo_data->>'supplier_id')::UUID,
    (p_wo_data->>'weaving_unit_price')::NUMERIC,
    p_wo_data->>'notes'
  ) RETURNING id INTO v_wo_id;

  IF p_wo_data->'yarn_requirements' IS NOT NULL AND jsonb_array_length(p_wo_data->'yarn_requirements') > 0 THEN
    FOR req IN SELECT * FROM jsonb_array_elements(p_wo_data->'yarn_requirements') LOOP
      INSERT INTO work_order_y_requirements (
        tenant_id, work_order_id, yarn_catalog_id, bom_ratio_pct, required_kg, allocated_kg
      ) VALUES (
        (p_wo_data->>'tenant_id')::UUID,
        v_wo_id,
        (req->>'yarn_catalog_id')::UUID,
        (req->>'bom_ratio_pct')::NUMERIC,
        (req->>'required_kg')::NUMERIC,
        COALESCE((req->>'allocated_kg')::NUMERIC, 0)
      );
    END LOOP;
  END IF;

  RETURN v_wo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rpc_update_work_order(
  p_wo_id UUID,
  p_wo_data JSONB
)
RETURNS VOID AS $$
DECLARE
  req JSONB;
BEGIN
  UPDATE work_orders
  SET
    order_id = COALESCE((p_wo_data->>'order_id')::UUID, order_id),
    bom_template_id = COALESCE((p_wo_data->>'bom_template_id')::UUID, bom_template_id),
    bom_version = COALESCE((p_wo_data->>'bom_version')::INT, bom_version),
    target_quantity = COALESCE((p_wo_data->>'target_quantity')::NUMERIC, target_quantity),
    target_unit = COALESCE(NULLIF(p_wo_data->>'target_unit', ''), target_unit),
    target_weight_kg = COALESCE((p_wo_data->>'target_weight_kg')::NUMERIC, target_weight_kg),
    standard_loss_pct = COALESCE((p_wo_data->>'standard_loss_pct')::NUMERIC, standard_loss_pct),
    status = COALESCE(NULLIF(p_wo_data->>'status', ''), status::text)::order_status,
    start_date = COALESCE((p_wo_data->>'start_date')::DATE, start_date),
    end_date = COALESCE((p_wo_data->>'end_date')::DATE, end_date),
    supplier_id = COALESCE((p_wo_data->>'supplier_id')::UUID, supplier_id),
    weaving_unit_price = COALESCE((p_wo_data->>'weaving_unit_price')::NUMERIC, weaving_unit_price),
    notes = p_wo_data->>'notes',
    updated_at = NOW()
  WHERE id = p_wo_id;

  IF p_wo_data->'yarn_requirements' IS NOT NULL THEN
    DELETE FROM work_order_y_requirements WHERE work_order_id = p_wo_id;

    IF jsonb_array_length(p_wo_data->'yarn_requirements') > 0 THEN
      FOR req IN SELECT * FROM jsonb_array_elements(p_wo_data->'yarn_requirements') LOOP
        INSERT INTO work_order_y_requirements (
          tenant_id, work_order_id, yarn_catalog_id, bom_ratio_pct, required_kg, allocated_kg
        ) VALUES (
          (SELECT tenant_id FROM work_orders WHERE id = p_wo_id),
          p_wo_id,
          (req->>'yarn_catalog_id')::UUID,
          (req->>'bom_ratio_pct')::NUMERIC,
          (req->>'required_kg')::NUMERIC,
          COALESCE((req->>'allocated_kg')::NUMERIC, 0)
        );
      END LOOP;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
