-- ============================================================
-- MIGRATION: Self-Service Onboarding
-- Vinhphat.app - subdomain per tenant
-- ============================================================

-- ─── 1. Tao bang tenant_invitations ──────────────────────────

CREATE TABLE IF NOT EXISTS public.tenant_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff'
    CHECK (role IN ('admin', 'manager', 'staff', 'driver', 'sale')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.tenant_invitations (token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.tenant_invitations (email);
CREATE INDEX IF NOT EXISTS idx_invitations_tenant_id ON public.tenant_invitations (tenant_id);

-- RLS: chi admin cua tenant moi xem/tao invitation
ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_invitations" ON public.tenant_invitations;
CREATE POLICY "tenant_isolation_invitations" ON public.tenant_invitations
  FOR ALL USING (tenant_id = public.current_tenant_id());

-- ─── 2. RPC: Tao tenant moi (dung khi khach hang tu dang ky) ─

CREATE OR REPLACE FUNCTION public.create_tenant(
  p_name TEXT,
  p_slug TEXT,
  p_owner_id UUID
)
RETURNS public.tenants
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant public.tenants;
  v_tenant_id UUID;
BEGIN
  -- Validate slug (chi cho phep lowercase letters, numbers, hyphen)
  IF p_slug !~ '^[a-z0-9][a-z0-9-]{1,50}[a-z0-9]$' THEN
    RAISE EXCEPTION 'Slug khong hop le. Chi dung chu thuong, so va dau "-"';
  END IF;

  -- Check slug unique
  IF EXISTS (SELECT 1 FROM public.tenants WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'Subdomain "%" da duoc su dung', p_slug;
  END IF;

  -- Tao tenant
  INSERT INTO public.tenants (name, slug, owner_id, plan, status, max_users, trial_ends_at)
  VALUES (
    p_name,
    p_slug,
    p_owner_id,
    'trial',
    'trial',
    5,
    NOW() + INTERVAL '14 days' -- 14 ngay dung thu
  )
  RETURNING * INTO v_tenant;

  v_tenant_id := v_tenant.id;

  -- Tao subscription trial
  INSERT INTO public.subscriptions (tenant_id, plan, seats, status, current_period_end)
  VALUES (v_tenant_id, 'trial', 5, 'trial', CURRENT_DATE + INTERVAL '14 days');

  -- Them owner vao tenant_users
  INSERT INTO public.tenant_users (tenant_id, user_id, role, joined_at)
  VALUES (v_tenant_id, p_owner_id, 'owner', NOW());

  -- Cap nhat profiles.tenant_id
  UPDATE public.profiles
  SET tenant_id = v_tenant_id
  WHERE id = p_owner_id;

  RETURN v_tenant;
END;
$$;

-- ─── 3. RPC: Accept invitation ────────────────────────────────

CREATE OR REPLACE FUNCTION public.accept_invitation(
  p_token TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation public.tenant_invitations%ROWTYPE;
  v_user_email TEXT;
BEGIN
  -- Lay invitation
  SELECT * INTO v_invitation
  FROM public.tenant_invitations
  WHERE token = p_token
    AND accepted_at IS NULL
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Link moi khong hop le hoac da het han';
  END IF;

  -- Kiem tra email khop
  SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
  IF lower(v_user_email) != lower(v_invitation.email) THEN
    RAISE EXCEPTION 'Email khong khop voi loi moi';
  END IF;

  -- Kiem tra con slot khong
  IF NOT public.tenant_can_add_user(v_invitation.tenant_id) THEN
    RAISE EXCEPTION 'Tenant da het so luong user toi da';
  END IF;

  -- Them user vao tenant
  INSERT INTO public.tenant_users (tenant_id, user_id, role, invited_by, joined_at)
  VALUES (v_invitation.tenant_id, p_user_id, v_invitation.role, v_invitation.invited_by, NOW())
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role, is_active = true;

  -- Cap nhat profiles
  UPDATE public.profiles SET tenant_id = v_invitation.tenant_id WHERE id = p_user_id;

  -- Danh dau invitation da duoc chap nhan
  UPDATE public.tenant_invitations SET accepted_at = NOW() WHERE id = v_invitation.id;

  RETURN true;
END;
$$;

-- ─── 4. RPC: Check subdomain availability ────────────────────

CREATE OR REPLACE FUNCTION public.check_slug_available(p_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.tenants WHERE slug = p_slug
  );
$$;

-- ─── 5. Audit log cho tenant-level actions ────────────────────

CREATE TABLE IF NOT EXISTS public.tenant_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,       -- 'user_invited', 'plan_upgraded', 'user_removed'
  target_type TEXT,           -- 'user', 'subscription', 'tenant'
  target_id TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_audit_tenant_id ON public.tenant_audit_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_audit_created_at ON public.tenant_audit_logs (created_at DESC);

ALTER TABLE public.tenant_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_audit_logs" ON public.tenant_audit_logs;
CREATE POLICY "tenant_isolation_audit_logs" ON public.tenant_audit_logs
  FOR ALL USING (tenant_id = public.current_tenant_id());

-- ─── 6. Trigger: auto-update tenants.updated_at ──────────────

DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
