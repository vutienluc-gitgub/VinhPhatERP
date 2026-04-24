-- Fix rpc_create_work_order mismatch and return type
-- This migration drops the existing function and recreates it with the correct signature and JSONB return type.

DROP FUNCTION IF EXISTS public.rpc_create_work_order(jsonb, jsonb, jsonb);

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
    end_date, supplier_id, weaving_unit_price, notes
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
    p_wo_data->>'notes'
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
