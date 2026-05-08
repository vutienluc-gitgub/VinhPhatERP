-- Fix: current_tenant_id() returns NULL for customer portal users
-- Customer profiles may have tenant_id=NULL but have customer_id linking to customers table
-- This breaks chat and all RLS for customer portal users

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    p.tenant_id,
    (SELECT c.tenant_id FROM public.customers c WHERE c.id = p.customer_id)
  )
  FROM public.profiles p
  WHERE p.id = auth.uid()
$$;
