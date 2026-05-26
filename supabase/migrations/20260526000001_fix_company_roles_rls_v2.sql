-- Fix RLS policy for company_roles table to use the correct tenant_id resolution function

DROP POLICY IF EXISTS "Enable full access for authenticated users in tenant" ON public.company_roles;

CREATE POLICY "Enable full access for authenticated users in tenant" ON public.company_roles
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());
