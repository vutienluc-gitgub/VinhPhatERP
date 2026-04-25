-- Fix: Drop the old 1-param overload of rpc_create_work_order
-- The correct 3-param version (p_wo_data, p_reqs_data, p_progress_data) already exists
-- from migration 20260424031800. The old 1-param overload causes rpc:check confusion.

DROP FUNCTION IF EXISTS public.rpc_create_work_order(jsonb);
