-- ============================================================
-- MIGRATION: Add version column to tasks for OCC (Optimistic Concurrency Control)
-- ============================================================

-- 1. Add version column with default 1
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- 2. Create trigger function to auto-increment version on every update
CREATE OR REPLACE FUNCTION public.fn_increment_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Increment the version
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$;

-- 3. Attach trigger to tasks table
DROP TRIGGER IF EXISTS trg_increment_task_version ON public.tasks;
CREATE TRIGGER trg_increment_task_version
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_increment_version();
