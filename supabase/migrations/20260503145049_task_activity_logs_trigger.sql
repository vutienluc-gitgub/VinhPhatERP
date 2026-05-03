-- Migration: task_activity_logs_trigger
-- Description: Create task_activity_logs table, enable realtime, and add DB trigger on tasks UPDATE.

CREATE TABLE IF NOT EXISTS public.task_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    room_id UUID NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    tenant_id UUID NOT NULL DEFAULT public.current_tenant_id()
);

-- Index for realtime filtering
CREATE INDEX IF NOT EXISTS idx_task_activity_logs_room_id ON public.task_activity_logs(room_id);

-- Enable RLS
ALTER TABLE public.task_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_activity_logs_isolation" ON public.task_activity_logs
    AS RESTRICTIVE FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "task_activity_logs_select" ON public.task_activity_logs FOR SELECT TO authenticated USING (true);
-- DO NOT grant INSERT policy so frontend cannot write to this table manually!

-- Grant basic permissions
GRANT SELECT ON public.task_activity_logs TO authenticated;

-- Enable Realtime for this table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'task_activity_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.task_activity_logs;
    END IF;
END $$;

-- Trigger Function (Runs with elevated privileges to bypass RLS for inserts)
CREATE OR REPLACE FUNCTION public.tg_log_task_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.task_activity_logs(
            task_id, room_id, action_type, old_status, new_status, changed_by, tenant_id
        ) VALUES (
            NEW.id,
            NEW.id,
            'STATUS_CHANGED',
            OLD.status,
            NEW.status,
            auth.uid(),
            NEW.tenant_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger on tasks table
DROP TRIGGER IF EXISTS trigger_log_task_update ON public.tasks;
CREATE TRIGGER trigger_log_task_update
AFTER UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.tg_log_task_update();
