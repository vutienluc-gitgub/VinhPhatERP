-- =====================================================================================
-- Migration: Atomic BOM Creation
-- =====================================================================================

CREATE OR REPLACE FUNCTION rpc_create_bom(
  p_header jsonb,
  p_items jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bom_id uuid;
  v_tenant uuid;
  v_user_id uuid;
  v_ratio_sum numeric := 0;
  v_item jsonb;
BEGIN
  -- 1. Lấy context
  v_user_id := auth.uid();
  SELECT tenant_id INTO v_tenant FROM profiles WHERE id = v_user_id;

  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACCESS';
  END IF;

  -- 2. Kiểm tra trùng mã (Atomic check)
  IF EXISTS (
    SELECT 1 FROM bom_templates 
    WHERE code = p_header->>'code' AND tenant_id = v_tenant
  ) THEN
    RAISE EXCEPTION 'BOM_CODE_EXISTS: Mã BOM đã tồn tại';
  END IF;

  -- 3. Tạo BOM Header
  INSERT INTO bom_templates (
    tenant_id,
    code,
    name,
    target_fabric_id,
    target_width_cm,
    target_gsm,
    standard_loss_pct,
    notes,
    status,
    active_version,
    created_by
  ) VALUES (
    v_tenant,
    p_header->>'code',
    p_header->>'name',
    (p_header->>'target_fabric_id')::uuid,
    (p_header->>'target_width_cm')::numeric,
    (p_header->>'target_gsm')::numeric,
    COALESCE((p_header->>'standard_loss_pct')::numeric, 0),
    p_header->>'notes',
    'draft',
    1,
    v_user_id
  ) RETURNING id INTO v_bom_id;

  -- 4. Validate và Tạo BOM Items
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_ratio_sum := v_ratio_sum + (v_item->>'ratio_pct')::numeric;

      INSERT INTO bom_yarn_items (
        tenant_id,
        bom_template_id,
        version,
        yarn_catalog_id,
        ratio_pct,
        consumption_kg_per_m,
        notes,
        sort_order
      ) VALUES (
        v_tenant,
        v_bom_id,
        1,
        (v_item->>'yarn_catalog_id')::uuid,
        (v_item->>'ratio_pct')::numeric,
        (v_item->>'consumption_kg_per_m')::numeric,
        v_item->>'notes',
        COALESCE((v_item->>'sort_order')::smallint, 0)
      );
    END LOOP;

    -- Validate tổng tỉ lệ (bước dự phòng, dù form đã check)
    IF abs(v_ratio_sum - 100) > 0.01 THEN
      RAISE EXCEPTION 'INVALID_RATIO_SUM: Tổng tỉ lệ phải bằng 100%%';
    END IF;
  END IF;

  RETURN v_bom_id;
END;
$$;
