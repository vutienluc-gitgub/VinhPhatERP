CREATE OR REPLACE FUNCTION atomic_revise_bom(
  p_bom_id UUID,
  p_reason TEXT
) RETURNS VOID AS $$
DECLARE
  v_bom RECORD;
  v_new_version INTEGER;
BEGIN
  IF p_reason IS NULL OR p_reason = '' THEN
    RAISE EXCEPTION 'MISSING_REASON: Reason for revision is required';
  END IF;

  -- Read BOM
  SELECT * INTO v_bom FROM bom_templates WHERE id = p_bom_id;
  IF v_bom.id IS NULL THEN
    RAISE EXCEPTION 'BOM_NOT_FOUND: BOM does not exist';
  END IF;
  IF v_bom.status != 'approved' THEN
    RAISE EXCEPTION 'BOM_NOT_APPROVED: Only approved BOMs can be revised';
  END IF;

  v_new_version := v_bom.active_version + 1;

  -- Update Header Status
  UPDATE bom_templates
  SET
    status = 'draft',
    active_version = v_new_version,
    notes = p_reason,
    approved_by = NULL,
    approved_at = NULL,
    updated_at = NOW()
  WHERE id = p_bom_id;

  -- Update Items Version
  UPDATE bom_yarn_items
  SET version = v_new_version
  WHERE bom_template_id = p_bom_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
