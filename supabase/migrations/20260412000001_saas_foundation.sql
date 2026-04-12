-- ============================================================
-- MIGRATION: SaaS Foundation Layer
-- Nang cap tenants table + subscription + JWT-based tenant_id
-- ============================================================
-- Muc tieu: chuan bi nen tang cho vinhphat.app
-- Subdomain routing: [slug].vinhphat.app

-- ─── 1. Nang cap bang tenants ────────────────────────────────

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter'
    CHECK (plan IN ('starter', 'professional', 'enterprise', 'trial')),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'cancelled', 'trial')),
  ADD COLUMN IF NOT EXISTS max_users INT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#6366f1';

-- Cap nhat Vinh Phat thanh enterprise (khong gioi han)
UPDATE public.tenants
SET
  plan = 'enterprise',
  max_users = 9999,
  status = 'active'
WHERE slug = 'default';

-- ─── 2. Tao bang subscriptions ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'starter',
  seats INT NOT NULL DEFAULT 5,
  price_per_seat INT NOT NULL DEFAULT 500000, -- VND
  billing_cycle TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'cancelled', 'trial')),
  current_period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  current_period_end DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id)
);

-- Seed subscription cho Vinh Phat
INSERT INTO public.subscriptions (tenant_id, plan, seats, status)
SELECT id, 'enterprise', 9999, 'active'
FROM public.tenants
WHERE slug = 'default'
ON CONFLICT (tenant_id) DO NOTHING;

-- ─── 3. Tao bang tenant_users (lien ket user-tenant chinh thuc) ──

CREATE TABLE IF NOT EXISTS public.tenant_users (
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff'
    CHECK (role IN ('owner', 'admin', 'manager', 'staff', 'driver', 'sale')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  PRIMARY KEY (tenant_id, user_id)
);

-- Migrate tu profiles.tenant_id sang tenant_users
-- Exclude role 'customer' (Customer Portal users, khong phai ERP staff)
-- Cast role::text vi profiles.role la ENUM type
INSERT INTO public.tenant_users (tenant_id, user_id, role, joined_at)
SELECT
  p.tenant_id,
  p.id AS user_id,
  COALESCE(p.role::text, 'staff'),
  p.created_at
FROM public.profiles p
WHERE p.tenant_id IS NOT NULL
  AND COALESCE(p.role::text, 'staff') != 'customer'
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- ─── 4. RLS cho bang moi ─────────────────────────────────────

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- subscriptions: chi owner / admin cua tenant moi xem duoc
DROP POLICY IF EXISTS "tenant_isolation_subscriptions" ON public.subscriptions;
CREATE POLICY "tenant_isolation_subscriptions" ON public.subscriptions
  FOR ALL USING (tenant_id = public.current_tenant_id());

-- tenant_users: chi thanh vien cua tenant moi xem duoc
DROP POLICY IF EXISTS "tenant_isolation_tenant_users" ON public.tenant_users;
CREATE POLICY "tenant_isolation_tenant_users" ON public.tenant_users
  FOR ALL USING (tenant_id = public.current_tenant_id());

-- ─── 5. Indexes ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users (user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users (tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON public.subscriptions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants (slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants (status);

-- ─── 6. Them tenant_id cho cac bang chua co (8 bang) ────────

DO $$
DECLARE
  default_tenant_id UUID;
  missing_tables TEXT[] := ARRAY[
    'business_audit_log',
    'colors',
    'employees',
    'inventory_adjustments',
    'order_lot_allocations',
    'payment_accounts',
    'progress_audit_log',
    'settings'
  ];
  t TEXT;
BEGIN
  SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'default';

  IF default_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Khong tim thay tenant default. Kiem tra lai bang tenants.';
  END IF;

  FOREACH t IN ARRAY missing_tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      -- Them cot tenant_id neu chua co
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = t AND column_name = 'tenant_id'
      ) THEN
        EXECUTE format(
          'ALTER TABLE public.%I ADD COLUMN tenant_id UUID REFERENCES public.tenants(id)', t
        );
        EXECUTE format(
          'UPDATE public.%I SET tenant_id = $1 WHERE tenant_id IS NULL', t
        ) USING default_tenant_id;

        -- Drop RLS policies cu (thường là "authenticated users")
        EXECUTE format(
          'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t
        );
        EXECUTE format(
          'DROP POLICY IF EXISTS "Enable full access for authenticated users" ON public.%I', t
        );
        EXECUTE format(
          'DROP POLICY IF EXISTS "tenant_isolation_%s" ON public.%I', t, t
        );
        EXECUTE format(
          'CREATE POLICY "tenant_isolation_%s" ON public.%I
           FOR ALL USING (tenant_id = public.current_tenant_id())', t, t
        );
        EXECUTE format(
          'CREATE INDEX IF NOT EXISTS idx_%s_tenant_id ON public.%I (tenant_id)', t, t
        );

        RAISE NOTICE 'Added tenant_id + RLS to %', t;
      ELSE
        RAISE NOTICE 'Table % already has tenant_id, skipping', t;
      END IF;
    ELSE
      RAISE NOTICE 'Table % does not exist, skipping', t;
    END IF;
  END LOOP;
END $$;


-- ─── 7. Helper: dem so user hien tai cua tenant ──────────────

CREATE OR REPLACE FUNCTION public.get_tenant_user_count(p_tenant_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INT
  FROM public.tenant_users
  WHERE tenant_id = p_tenant_id AND is_active = true;
$$;

-- ─── 8. Helper: kiem tra tenant con slot user khong ──────────

CREATE OR REPLACE FUNCTION public.tenant_can_add_user(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    get_tenant_user_count(p_tenant_id) < t.max_users
  FROM public.tenants t
  WHERE t.id = p_tenant_id AND t.status = 'active';
$$;
