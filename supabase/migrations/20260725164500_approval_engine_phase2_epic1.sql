-- Migration: Approval Engine Phase 2 - Epic 1
-- Description: Support parallel steps and conditional branching

-- 1. Modify approval_workflow_steps
ALTER TABLE public.approval_workflow_steps DROP CONSTRAINT IF EXISTS approval_workflow_steps_workflow_id_step_order_key;
ALTER TABLE public.approval_workflow_steps ADD CONSTRAINT approval_workflow_steps_workflow_step_role_key UNIQUE(workflow_id, step_order, role);

ALTER TABLE public.approval_workflow_steps ADD COLUMN is_parallel BOOLEAN DEFAULT false;
ALTER TABLE public.approval_workflow_steps ADD COLUMN conditions JSONB DEFAULT '{}'::jsonb;

-- 2. Modify approval_steps
ALTER TABLE public.approval_steps DROP CONSTRAINT IF EXISTS approval_steps_request_id_step_order_key;
ALTER TABLE public.approval_steps ADD CONSTRAINT approval_steps_request_step_role_key UNIQUE(request_id, step_order, role);

ALTER TABLE public.approval_steps ADD COLUMN is_parallel BOOLEAN DEFAULT false;
