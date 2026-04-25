-- Fix RLS policy for looms
DROP POLICY IF EXISTS looms_tenant_isolation ON public.looms;

CREATE POLICY looms_tenant_isolation ON public.looms
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());
