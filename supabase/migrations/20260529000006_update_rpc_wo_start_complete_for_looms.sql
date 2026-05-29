-- Update WO Start/Complete RPCs to synchronize with MES Loom states

-- 1. Start Work Order
DROP FUNCTION IF EXISTS public.rpc_start_work_order(UUID, DATE);
CREATE OR REPLACE FUNCTION rpc_start_work_order(p_wo_id UUID, p_today DATE) RETURNS VOID AS $$
DECLARE
  v_order_id UUID;
  v_loom_id UUID;
BEGIN
  UPDATE work_orders
  SET status = 'in_progress'::work_order_status, start_date = CURRENT_DATE
  WHERE id = p_wo_id
  RETURNING order_id, loom_id INTO v_order_id, v_loom_id;
  
  IF v_order_id IS NOT NULL THEN
    UPDATE order_progress SET status = 'in_progress'::stage_status, actual_date = p_today
    WHERE order_id = v_order_id AND stage = 'weaving'::production_stage AND status = 'pending'::stage_status;
  ELSE
    UPDATE order_progress SET status = 'in_progress'::stage_status, actual_date = p_today
    WHERE work_order_id = p_wo_id AND stage = 'weaving'::production_stage AND status = 'pending'::stage_status;
  END IF;

  -- Sync MES Loom Status
  IF v_loom_id IS NOT NULL THEN
    UPDATE looms SET status = 'running' WHERE id = v_loom_id;
    UPDATE loom_production_states 
    SET current_work_order_id = p_wo_id, updated_at = NOW()
    WHERE loom_id = v_loom_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Complete Work Order
DROP FUNCTION IF EXISTS public.rpc_complete_work_order(UUID, NUMERIC, DATE);
CREATE OR REPLACE FUNCTION rpc_complete_work_order(p_wo_id UUID, p_yield_m NUMERIC, p_today DATE) RETURNS VOID AS $$
DECLARE
  v_order_id UUID;
  v_loom_id UUID;
BEGIN
  UPDATE work_orders
  SET status = 'completed'::work_order_status, actual_yield_m = p_yield_m, end_date = CURRENT_DATE
  WHERE id = p_wo_id
  RETURNING order_id, loom_id INTO v_order_id, v_loom_id;
  
  IF v_order_id IS NOT NULL THEN
    UPDATE order_progress SET status = 'done'::stage_status, actual_date = p_today
    WHERE order_id = v_order_id AND stage = 'weaving'::production_stage;
  ELSE
    UPDATE order_progress SET status = 'done'::stage_status, actual_date = p_today
    WHERE work_order_id = p_wo_id AND stage = 'weaving'::production_stage;
  END IF;

  -- Sync MES Loom Status
  IF v_loom_id IS NOT NULL THEN
    UPDATE looms SET status = 'idle' WHERE id = v_loom_id;
    UPDATE loom_production_states 
    SET current_work_order_id = NULL, updated_at = NOW()
    WHERE loom_id = v_loom_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
