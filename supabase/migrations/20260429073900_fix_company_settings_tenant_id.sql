-- ============================================================
-- Migration: Fix company_settings rows with NULL tenant_id
-- ============================================================
-- Existing company_settings rows were seeded before the tenant
-- migration, leaving tenant_id = NULL. The RESTRICTIVE RLS policy
-- tenant_isolation_company_settings requires tenant_id = current_tenant_id(),
-- which causes all upserts to fail on the USING expression check.
-- ============================================================

UPDATE public.company_settings
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'default' LIMIT 1)
WHERE tenant_id IS NULL;
