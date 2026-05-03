-- Migration: rpc_get_kanban_dashboard
-- Description: Trả về cục data JSON gồm tasks, employees, kpis, workload và activities để giảm tải HTTP request.

CREATE OR REPLACE FUNCTION public.rpc_get_kanban_dashboard()
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
AS $$
  WITH t_tasks AS (
    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) AS tasks
    FROM (
      SELECT * FROM public.tasks
      ORDER BY due_date ASC NULLS LAST
    ) t
  ),
  t_employees AS (
    SELECT COALESCE(jsonb_agg(e), '[]'::jsonb) AS employees
    FROM (
      SELECT * FROM public.employees
      WHERE status = 'active'
      ORDER BY name ASC
    ) e
  ),
  t_kpis AS (
    SELECT COALESCE(jsonb_agg(k), '[]'::jsonb) AS kpis
    FROM (
      SELECT * FROM public.kpis
      ORDER BY code ASC
    ) k
  ),
  t_workload AS (
    SELECT COALESCE(jsonb_agg(w), '[]'::jsonb) AS workload
    FROM (
      SELECT * FROM public.v_employee_workload
      ORDER BY open_tasks DESC
    ) w
  ),
  t_activities AS (
    SELECT COALESCE(jsonb_agg(a), '[]'::jsonb) AS activities
    FROM (
      SELECT 
        l.id, 
        l.created_at, 
        l.event_type, 
        l.payload, 
        l.user_id,
        jsonb_build_object('full_name', p.full_name) as profiles
      FROM public.business_audit_log l
      LEFT JOIN public.profiles p ON l.user_id = p.id
      ORDER BY l.created_at DESC
      LIMIT 10
    ) a
  )
  SELECT jsonb_build_object(
    'tasks', (SELECT tasks FROM t_tasks),
    'employees', (SELECT employees FROM t_employees),
    'kpis', (SELECT kpis FROM t_kpis),
    'workload', (SELECT workload FROM t_workload),
    'activities', (SELECT activities FROM t_activities)
  );
$$;

GRANT EXECUTE ON FUNCTION public.rpc_get_kanban_dashboard() TO authenticated;
