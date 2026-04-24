-- ============================================================
-- MIGRATION: Add Operations Module Tables (Tasks, KPIs)
-- ============================================================

-- 1. KPIs Table
CREATE TABLE IF NOT EXISTS public.kpis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL, -- %, VND, đơn, kg, ...
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code, tenant_id)
);

-- 2. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id),
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES public.employees(id),
  reviewer_id UUID REFERENCES public.employees(id),
  linked_kpi_id UUID REFERENCES public.kpis(id),
  priority TEXT NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
  task_type TEXT NOT NULL DEFAULT 'growth', -- growth, maintenance, admin
  status TEXT NOT NULL DEFAULT 'todo', -- todo, in_progress, blocked, review, done, cancelled
  due_date DATE,
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (using the pattern from 20260407000000_add_tenant_id.sql)
CREATE POLICY tenant_isolation_kpis ON public.kpis
  FOR ALL USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY tenant_isolation_tasks ON public.tasks
  FOR ALL USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- 5. Create Indexes
CREATE INDEX idx_kpis_tenant_id ON public.kpis (tenant_id);
CREATE INDEX idx_tasks_tenant_id ON public.tasks (tenant_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks (assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks (status);

-- 6. Grant Access
GRANT ALL ON public.kpis TO authenticated;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.kpis TO service_role;
GRANT ALL ON public.tasks TO service_role;
