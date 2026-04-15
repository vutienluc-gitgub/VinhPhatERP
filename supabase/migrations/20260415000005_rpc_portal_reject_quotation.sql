-- =============================================================================
-- Migration: Create RPC for Portal Quotation Rejection
-- Purpose: Safely update quotation status to rejected with notes.
-- =============================================================================

CREATE OR REPLACE FUNCTION rpc_portal_reject_quotation(
  p_quotation_id UUID,
  p_reason TEXT
) RETURNS JSONB AS $$
DECLARE
  v_q RECORD;
BEGIN
  -- Read and Lock quotation
  SELECT * INTO v_q FROM quotations WHERE id = p_quotation_id FOR UPDATE;
  IF v_q.id IS NULL THEN
    RAISE EXCEPTION 'QUOTATION_NOT_FOUND: Báo giá không tồn tại';
  END IF;
  
  -- Prevent multiple actions
  IF v_q.status = 'confirmed' OR v_q.status = 'converted' THEN
    RAISE EXCEPTION 'QUOTATION_ALREADY_ACCEPTED: Báo giá này đã được chấp nhận trước đó';
  END IF;

  IF v_q.status = 'rejected' THEN
    RAISE EXCEPTION 'QUOTATION_ALREADY_REJECTED: Báo giá này đã bị từ chối';
  END IF;

  -- Update quotation status to rejected
  UPDATE quotations 
  SET 
    status = 'rejected', 
    notes = CASE WHEN notes IS NOT NULL AND notes != '' THEN notes || E'\nLý do từ chối khách ghi: ' || p_reason ELSE 'Lý do từ chối: ' || p_reason END
  WHERE id = p_quotation_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION rpc_portal_reject_quotation(UUID, TEXT) TO authenticated;
