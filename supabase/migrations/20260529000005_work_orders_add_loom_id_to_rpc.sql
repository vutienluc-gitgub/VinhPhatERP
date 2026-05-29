-- Migration: Update Work Order RPCs to support loom_id assignment

-- 1. Update rpc_create_work_order
DROP FUNCTION IF EXISTS public.rpc_create_work_order(JSONB, JSONB, JSONB);
CREATE OR REPLACE FUNCTION public.rpc_create_work_order(
  p_wo_data JSONB,
  p_reqs_data JSONB,
  p_progress_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_wo_id UUID;
  v_wo_result JSONB;
BEGIN
  INSERT INTO public.work_orders (
    tenant_id, work_order_number, order_id, bom_template_id, bom_version, target_quantity,
    target_unit, target_weight_kg, standard_loss_pct, status, start_date,
    end_date, supplier_id, weaving_unit_price, notes, loom_id
  )
  VALUES (
    (p_wo_data->>'tenant_id')::UUID,
    p_wo_data->>'work_order_number',
    NULLIF(p_wo_data->>'order_id', '')::UUID,
    (p_wo_data->>'bom_template_id')::UUID,
    (p_wo_data->>'bom_version')::INTEGER,
    (p_wo_data->>'target_quantity')::NUMERIC,
    COALESCE(NULLIF(p_wo_data->>'target_unit', ''), 'm'),
    (p_wo_data->>'target_weight_kg')::NUMERIC,
    (p_wo_data->>'standard_loss_pct')::NUMERIC,
    COALESCE(NULLIF(p_wo_data->>'status', ''), 'draft')::public.work_order_status,
    NULLIF(p_wo_data->>'start_date', '')::DATE,
    NULLIF(p_wo_data->>'end_date', '')::DATE,
    NULLIF(p_wo_data->>'supplier_id', '')::UUID,
    (p_wo_data->>'weaving_unit_price')::NUMERIC,
    p_wo_data->>'notes',
    NULLIF(p_wo_data->>'loom_id', '')::UUID
  )
  RETURNING id INTO v_wo_id;

  IF p_reqs_data IS NOT NULL AND jsonb_array_length(p_reqs_data) > 0 THEN
    INSERT INTO public.work_order_y_requirements (
      tenant_id, work_order_id, yarn_catalog_id, bom_ratio_pct, required_kg, allocated_kg
    )
    SELECT
      (p_wo_data->>'tenant_id')::UUID,
      v_wo_id,
      (req->>'yarn_catalog_id')::UUID,
      (req->>'bom_ratio_pct')::NUMERIC,
      (req->>'required_kg')::NUMERIC,
      (req->>'allocated_kg')::NUMERIC
    FROM jsonb_array_elements(p_reqs_data) AS req;
  END IF;

  IF p_progress_data IS NOT NULL AND jsonb_array_length(p_progress_data) > 0 THEN
    INSERT INTO public.order_progress (
      tenant_id, work_order_id, order_id, stage, status
    )
    SELECT
      (p_wo_data->>'tenant_id')::UUID,
      v_wo_id,
      NULLIF(prog->>'order_id', '')::UUID,
      (prog->>'stage')::public.production_stage,
      COALESCE(NULLIF(prog->>'status', ''), 'pending')::public.stage_status
    FROM jsonb_array_elements(p_progress_data) AS prog;
  END IF;

  SELECT to_jsonb(t) INTO v_wo_result FROM public.work_orders t WHERE id = v_wo_id;
  RETURN v_wo_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Update rpc_update_work_order
DROP FUNCTION IF EXISTS public.rpc_update_work_order(UUID, JSONB, TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION rpc_update_work_order(
  p_wo_id UUID,
  p_wo_data JSONB,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  req JSONB;
  v_current_updated_at TIMESTAMPTZ;
BEGIN
  -- OCC Guard
  IF p_expected_updated_at IS NOT NULL THEN
    SELECT updated_at INTO v_current_updated_at
    FROM work_orders WHERE id = p_wo_id FOR UPDATE;

    IF date_trunc('milliseconds', v_current_updated_at) != date_trunc('milliseconds', p_expected_updated_at) THEN
      RAISE EXCEPTION 'OCC_MISMATCH: Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.';
    END IF;
  END IF;

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
    loom_id = CASE WHEN p_wo_data->>'loom_id' = 'none' THEN NULL ELSE COALESCE((p_wo_data->>'loom_id')::UUID, loom_id) END,
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
