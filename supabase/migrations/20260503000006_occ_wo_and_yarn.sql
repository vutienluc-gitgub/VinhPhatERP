-- Migration: Add Optimistic Concurrency Control (OCC) to Work Orders and Yarn Receipts

-- 1. Work Orders OCC
DROP FUNCTION IF EXISTS public.rpc_update_work_order(UUID, JSONB);
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


-- 2. Yarn Receipts OCC
-- Note: the function was renamed from atomic_update_yarn_receipt to rpc_update_yarn_receipt
DROP FUNCTION IF EXISTS public.rpc_update_yarn_receipt(UUID, JSONB, JSONB);
DROP FUNCTION IF EXISTS public.atomic_update_yarn_receipt(UUID, JSONB, JSONB);

CREATE OR REPLACE FUNCTION rpc_update_yarn_receipt(
  p_id UUID,
  p_header JSONB,
  p_items JSONB,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_current_updated_at TIMESTAMPTZ;
BEGIN
  -- OCC Guard
  IF p_expected_updated_at IS NOT NULL THEN
    SELECT updated_at INTO v_current_updated_at
    FROM yarn_receipts WHERE id = p_id FOR UPDATE;

    IF date_trunc('milliseconds', v_current_updated_at) != date_trunc('milliseconds', p_expected_updated_at) THEN
      RAISE EXCEPTION 'OCC_MISMATCH: Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.';
    END IF;
  END IF;

  UPDATE yarn_receipts
  SET
    receipt_number = COALESCE(p_header->>'receipt_number', receipt_number),
    supplier_id = COALESCE((p_header->>'supplier_id')::UUID, supplier_id),
    receipt_date = COALESCE((p_header->>'receipt_date')::DATE, receipt_date),
    notes = CASE WHEN (p_header->>'notes') IS NOT NULL AND (p_header->>'notes') = '' THEN NULL ELSE COALESCE(CASE WHEN jsonb_typeof(p_header->'notes') = 'null' THEN NULL ELSE p_header->>'notes' END, notes) END,
    total_amount = COALESCE((p_header->>'total_amount')::NUMERIC, total_amount),
    updated_at = NOW()
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
