CREATE OR REPLACE FUNCTION atomic_start_work_order(p_wo_id UUID, p_today DATE) RETURNS VOID AS $$
DECLARE
  v_order_id UUID;
BEGIN
  UPDATE work_orders
  SET status = 'in_progress'::work_order_status, start_date = CURRENT_DATE
  WHERE id = p_wo_id
  RETURNING order_id INTO v_order_id;
  
  IF v_order_id IS NOT NULL THEN
    UPDATE order_progress SET status = 'in_progress'::stage_status, actual_date = p_today
    WHERE order_id = v_order_id AND stage = 'weaving'::production_stage AND status = 'pending'::stage_status;
  ELSE
    UPDATE order_progress SET status = 'in_progress'::stage_status, actual_date = p_today
    WHERE work_order_id = p_wo_id AND stage = 'weaving'::production_stage AND status = 'pending'::stage_status;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
