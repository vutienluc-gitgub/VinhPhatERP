-- ============================================================
-- Fix: Drop old function signatures before recreating with
-- new p_tenant_id parameter (PostgreSQL requires DROP when
-- signature changes, CREATE OR REPLACE only works for same sig)
-- ============================================================

-- Drop old signatures (1-param versions)
DROP FUNCTION IF EXISTS public.rpc_get_user_permissions(text);
DROP FUNCTION IF EXISTS public.rpc_upsert_role_permissions(text, jsonb);

-- Recreate with explicit p_tenant_id parameter
CREATE OR REPLACE FUNCTION public.rpc_get_user_permissions(
  p_role text,
  p_tenant_id uuid
)
RETURNS TABLE(permission_key text, granted boolean) AS $$
BEGIN
  RETURN QUERY
    SELECT rp.permission_key, rp.granted
    FROM public.role_permissions rp
    WHERE rp.tenant_id = p_tenant_id
      AND rp.role = p_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.rpc_upsert_role_permissions(
  p_role text,
  p_tenant_id uuid,
  p_permissions jsonb
)
RETURNS void AS $$
DECLARE
  perm jsonb;
BEGIN
  FOR perm IN SELECT * FROM jsonb_array_elements(p_permissions)
  LOOP
    INSERT INTO public.role_permissions (tenant_id, role, permission_key, granted, updated_at)
    VALUES (
      p_tenant_id,
      p_role,
      perm->>'key',
      (perm->>'granted')::boolean,
      now()
    )
    ON CONFLICT (tenant_id, role, permission_key)
    DO UPDATE SET granted = (perm->>'granted')::boolean, updated_at = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
