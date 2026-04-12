-- ============================================================
-- AUDIT QUERY: Kiem tra tat ca bang co tenant_id chua
-- Chay trong Supabase SQL Editor truoc khi apply migration
-- ============================================================

-- 1. Bang nao CHUA co tenant_id
SELECT
  t.table_name,
  CASE
    WHEN c.column_name IS NOT NULL THEN 'CO tenant_id'
    ELSE 'THIEU tenant_id'
  END AS tenant_status,
  CASE
    WHEN rl.rowsecurity THEN 'RLS enabled'
    ELSE 'RLS OFF'
  END AS rls_status
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
  AND c.table_name = t.table_name
  AND c.column_name = 'tenant_id'
LEFT JOIN pg_tables rl
  ON rl.tablename = t.table_name
  AND rl.schemaname = 'public'
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT IN (
    'tenants', 'tenant_users', 'tenant_invitations', 'subscriptions',
    'tenant_audit_logs', 'profiles', 'spatial_ref_sys', 'schema_migrations'
  )
ORDER BY
  CASE WHEN c.column_name IS NULL THEN 0 ELSE 1 END,
  t.table_name;

-- 2. Kiem tra tenant hien tai (chi dung columns chac chan co)
SELECT
  id,
  slug,
  name,
  is_active,
  created_at
FROM public.tenants;

-- 3. Kiem tra cot nao da co trong bang tenants
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenants'
ORDER BY ordinal_position;
