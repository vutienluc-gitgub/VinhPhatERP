CREATE OR REPLACE FUNCTION atomic_approve_bom(
  p_bom_id UUID,
  p_reason TEXT,
  p_user_id UUID
) RETURNS VOID AS $$
DECLARE
  v_bom RECORD;
  v_items JSONB;
  v_total_ratio NUMERIC;
  v_snapshot JSONB;
BEGIN
  -- Read BOM
  SELECT * INTO v_bom FROM bom_templates WHERE id = p_bom_id;
  IF v_bom.id IS NULL THEN
    RAISE EXCEPTION 'BOM_NOT_FOUND: BOM does not exist';
  END IF;
  IF v_bom.status != 'draft' THEN
    RAISE EXCEPTION 'BOM_NOT_DRAFT: BOM is not in draft status';
  END IF;

  -- Read Items
  SELECT jsonb_agg(to_jsonb(i)) INTO v_items
  FROM bom_yarn_items i
  WHERE bom_template_id = p_bom_id;

  IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'BOM_EMPTY: Cannot approve BOM without yarn composition items';
  END IF;

  -- Validate Total Ratio
  SELECT COALESCE(SUM(ratio_pct), 0) INTO v_total_ratio
  FROM bom_yarn_items
  WHERE bom_template_id = p_bom_id;

  IF ABS(v_total_ratio - 100) > 0.01 THEN
    RAISE EXCEPTION 'INVALID_RATIO_SUM: Total material ratio must be exactly 100%%';
  END IF;

  -- Build Snapshot Payload
  v_snapshot := jsonb_build_object(
    'bom_yarn_items', v_items,
    'target_width_cm', v_bom.target_width_cm,
    'target_gsm', v_bom.target_gsm,
    'standard_loss_pct', v_bom.standard_loss_pct
  );

  -- Insert Version
  INSERT INTO bom_versions (
    bom_template_id, version, change_reason, snapshot, created_by
  ) VALUES (
    p_bom_id, v_bom.active_version, COALESCE(p_reason, 'Phê duyệt ban đầu'), v_snapshot, p_user_id
  );

  -- Update Header Status
  UPDATE bom_templates
  SET
    status = 'approved',
    approved_by = p_user_id,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_bom_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
