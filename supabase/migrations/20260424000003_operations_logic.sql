-- ============================================================
-- MIGRATION: Add Operations Business Logic (Triggers & RPCs)
-- ============================================================

-- 1. Helper Function: Audit Task Changes
-- Automatically logs status and priority changes to business_audit_log
CREATE OR REPLACE FUNCTION public.fn_audit_task_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.status <> NEW.status OR OLD.priority <> NEW.priority OR OLD.assignee_id <> NEW.assignee_id) THEN
            INSERT INTO public.business_audit_log (
                tenant_id,
                entity_id,
                entity_type,
                event_type,
                payload,
                user_id
            ) VALUES (
                NEW.tenant_id,
                NEW.id,
                'task',
                'task_updated',
                jsonb_build_object(
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'old_priority', OLD.priority,
                    'new_priority', NEW.priority,
                    'title', NEW.title
                ),
                auth.uid()
            );
        END IF;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.business_audit_log (
            tenant_id,
            entity_id,
            entity_type,
            event_type,
            payload,
            user_id
        ) VALUES (
            NEW.tenant_id,
            NEW.id,
            'task',
            'task_created',
            jsonb_build_object('title', NEW.title, 'status', NEW.status),
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$;

-- 2. Trigger for Task Auditing
DROP TRIGGER IF EXISTS trg_audit_task ON public.tasks;
CREATE TRIGGER trg_audit_task
    AFTER INSERT OR UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_task_changes();

-- 3. RPC: Complete Task with Actual Hours
-- Ensures that when a task is completed, we record the time and log it correctly.
CREATE OR REPLACE FUNCTION public.rpc_complete_task(
    p_task_id UUID,
    p_actual_hours NUMERIC DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant UUID;
BEGIN
    SELECT tenant_id INTO v_tenant FROM public.tasks WHERE id = p_task_id;
    
    -- Check tenant access
    IF v_tenant <> public.current_tenant_id() THEN
        RAISE EXCEPTION 'Unauthorized tenant access';
    END IF;

    UPDATE public.tasks
    SET 
        status = 'done',
        actual_hours = COALESCE(p_actual_hours, actual_hours),
        updated_at = NOW()
    WHERE id = p_task_id;
    
    -- Optional: Link with KPI update logic here if needed
END;
$$;

-- 4. View: Employee Workload Summary
-- Useful for the workload chart in the dashboard
CREATE OR REPLACE VIEW public.v_employee_workload AS
SELECT 
    e.id as employee_id,
    e.name,
    e.tenant_id,
    COUNT(t.id) FILTER (WHERE t.status NOT IN ('done', 'cancelled')) as open_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'in_progress') as in_progress_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'blocked') as blocked_tasks,
    COUNT(t.id) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('done', 'cancelled')) as overdue_tasks
FROM public.employees e
LEFT JOIN public.tasks t ON e.id = t.assignee_id
GROUP BY e.id, e.name, e.tenant_id;

-- Grant permissions for the view
GRANT SELECT ON public.v_employee_workload TO authenticated;
GRANT SELECT ON public.v_employee_workload TO service_role;
