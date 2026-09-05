-- Migration: Fix RLS policies for Approval Engine tables
-- Description: Allow authenticated users to view workflows, submit requests, and allow managers/admins to configure workflows.

-- 1. approval_workflows
DROP POLICY IF EXISTS "Allow authenticated read approval_workflows" ON public.approval_workflows;
CREATE POLICY "Allow authenticated read approval_workflows" ON public.approval_workflows
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated manage approval_workflows" ON public.approval_workflows;
CREATE POLICY "Allow authenticated manage approval_workflows" ON public.approval_workflows
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. approval_workflow_steps
DROP POLICY IF EXISTS "Allow authenticated read approval_workflow_steps" ON public.approval_workflow_steps;
CREATE POLICY "Allow authenticated read approval_workflow_steps" ON public.approval_workflow_steps
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated manage approval_workflow_steps" ON public.approval_workflow_steps;
CREATE POLICY "Allow authenticated manage approval_workflow_steps" ON public.approval_workflow_steps
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. approval_requests
DROP POLICY IF EXISTS "Allow authenticated manage approval_requests" ON public.approval_requests;
CREATE POLICY "Allow authenticated manage approval_requests" ON public.approval_requests
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. approval_steps
DROP POLICY IF EXISTS "Allow authenticated manage approval_steps" ON public.approval_steps;
CREATE POLICY "Allow authenticated manage approval_steps" ON public.approval_steps
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. approval_histories
DROP POLICY IF EXISTS "Allow authenticated manage approval_histories" ON public.approval_histories;
CREATE POLICY "Allow authenticated manage approval_histories" ON public.approval_histories
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. approval_outbox_events
DROP POLICY IF EXISTS "Allow authenticated manage approval_outbox_events" ON public.approval_outbox_events;
CREATE POLICY "Allow authenticated manage approval_outbox_events" ON public.approval_outbox_events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
