-- Migration: Approval Engine Phase 3 - Epic 3
-- Description: SLA, Escalation & Delegation

-- 1. Modify approval_workflow_steps
ALTER TABLE public.approval_workflow_steps ADD COLUMN sla_hours NUMERIC(10, 2);
ALTER TABLE public.approval_workflow_steps ADD COLUMN escalation_action VARCHAR(50); -- 'notify', 'auto_approve', 'auto_reject', 'escalate_role'
ALTER TABLE public.approval_workflow_steps ADD COLUMN escalation_role VARCHAR(100);

-- 2. Modify approval_steps
ALTER TABLE public.approval_steps ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.approval_steps ADD COLUMN deadline TIMESTAMPTZ;
ALTER TABLE public.approval_steps ADD COLUMN is_overdue BOOLEAN DEFAULT false;
ALTER TABLE public.approval_steps ADD COLUMN delegated_to_user_id UUID;
ALTER TABLE public.approval_steps ADD COLUMN sla_hours NUMERIC(10, 2);
ALTER TABLE public.approval_steps ADD COLUMN escalation_action VARCHAR(50);
ALTER TABLE public.approval_steps ADD COLUMN escalation_role VARCHAR(100);
