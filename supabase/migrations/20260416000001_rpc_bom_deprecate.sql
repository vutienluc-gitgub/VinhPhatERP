CREATE OR REPLACE FUNCTION atomic_deprecate_bom(
  p_bom_id UUID,
  p_reason TEXT,
  p_user_id UUID
) RETURNS VOID AS $$
DECLARE
  v_bom RECORD;
  v_updated_notes TEXT;
BEGIN
  -- Validate reason
  IF p_reason IS NULL OR p_reason = '' THEN
    RAISE EXCEPTION 'MISSING_REASON: Reason for deprecation is required';
  END IF;

  -- Read BOM with row lock to prevent race conditions
  SELECT * INTO v_bom FROM bom_templates WHERE id = p_bom_id FOR UPDATE;
  IF v_bom.id IS NULL THEN
    RAISE EXCEPTION 'BOM_NOT_FOUND: BOM does not exist';
  END IF;
  IF v_bom.status != 'approved' THEN
    RAISE EXCEPTION 'BOM_NOT_APPROVED: Only approved BOMs can be deprecated';
  END IF;

  -- Preserve existing notes, append deprecation reason
  IF v_bom.notes IS NOT NULL AND v_bom.notes != '' THEN
    v_updated_notes := v_bom.notes || E'\n' || '[Bao phe]: ' || p_reason;
  ELSE
    v_updated_notes := '[Bao phe]: ' || p_reason;
  END IF;

  -- Update status atomically
  UPDATE bom_templates
  SET
    status = 'deprecated',
    notes = v_updated_notes,
    updated_at = NOW()
  WHERE id = p_bom_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
