-- ============================================================
-- Fix: rpc_get_user_permissions + rpc_upsert_role_permissions
-- Đổi từ current_setting('app.tenant_id') → p_tenant_id param
-- Root cause: project dùng getTenantId() từ client, không set
-- session variable → current_setting trả về NULL → NOT NULL fail
-- ============================================================

-- Fix role_permissions DEFAULT (không cần session var nữa)
ALTER TABLE public.role_permissions
  ALTER COLUMN tenant_id DROP DEFAULT;

-- Fix RLS policies — dùng auth.uid() + join profiles thay vì session var
DROP POLICY IF EXISTS "rp_tenant_read" ON public.role_permissions;
DROP POLICY IF EXISTS "rp_tenant_write" ON public.role_permissions;

-- RLS mới: user chỉ đọc được row của tenant mình
CREATE POLICY "rp_tenant_read" ON public.role_permissions
  FOR SELECT USING (
    tenant_id = (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "rp_tenant_write" ON public.role_permissions
  FOR ALL USING (
    tenant_id = (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

-- Fix RPC 1: Nhận p_tenant_id từ client
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

-- Fix RPC 2: Nhận p_tenant_id từ client
CREATE OR REPLACE FUNCTION public.rpc_upsert_role_permissions(
  p_role text,
  p_tenant_id uuid,
  p_permissions jsonb  -- [{"key": "orders:read", "granted": true}, ...]
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
