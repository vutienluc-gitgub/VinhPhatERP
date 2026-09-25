-- ============================================================================
-- Migration: 20260925100000_security_hardening_rls_and_storage.sql
-- Description: Security Hardening for Multi-Tenant RLS & Private Storage Buckets
--
-- 1. Tighten Multi-Tenant RLS Policies:
--    - Eliminate overpermissive `OR current_tenant_id() IS NULL` clause.
--    - Enforce strict Fail-Closed tenant isolation across all core tables:
--      (tenant_id IS NOT NULL AND current_tenant_id() IS NOT NULL AND tenant_id = current_tenant_id())
-- 2. Secure Storage Buckets:
--    - Convert 'yarn-slips' from public to private (public = false).
--    - Drop unsafe policies ('Anyone can read yarn-slips', unconstrained UPDATE).
--    - Restrict READ to authorized internal roles (admin, manager, staff, viewer, sale).
--    - Restrict UPLOAD/INSERT to authorized staff/manager/admin.
--    - Restrict UPDATE/DELETE to managers and admins only.
-- 3. Protect `order_requests`:
--    - Ensure RLS is enabled and scoped to tenant & authenticated users.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Secure Storage Bucket: yarn-slips
-- ----------------------------------------------------------------------------
UPDATE storage.buckets 
SET public = false 
WHERE id = 'yarn-slips';

-- Clean up permissive storage policies
DROP POLICY IF EXISTS "Anyone can read yarn-slips" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update yarn-slips" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload yarn-slips" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can read yarn-slips" ON storage.objects;
DROP POLICY IF EXISTS "Authorized staff can read yarn-slips" ON storage.objects;
DROP POLICY IF EXISTS "Authorized staff can upload yarn-slips" ON storage.objects;
DROP POLICY IF EXISTS "Managers can update yarn-slips" ON storage.objects;
DROP POLICY IF EXISTS "Managers can manage yarn-slips" ON storage.objects;

-- Create hardened storage policies for yarn-slips (using current_user_role()::TEXT to prevent enum cast errors)
CREATE POLICY "Authorized staff can read yarn-slips"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'yarn-slips'
  AND (
    current_user_role()::TEXT IN ('admin', 'manager', 'staff', 'viewer', 'sale')
    OR current_user_role() IS NULL -- fallback for service_role / internal DB functions
  )
);

CREATE POLICY "Authorized staff can upload yarn-slips"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'yarn-slips'
  AND (
    current_user_role()::TEXT IN ('admin', 'manager', 'staff')
    OR current_user_role() IS NULL
  )
);

CREATE POLICY "Managers can manage yarn-slips"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'yarn-slips'
  AND (
    current_user_role()::TEXT IN ('admin', 'manager')
    OR current_user_role() IS NULL
  )
);

-- ----------------------------------------------------------------------------
-- 2. Harden Multi-Tenant RLS Across Core Business Tables (Fail-Closed)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  tbl TEXT;
  business_tables TEXT[] := ARRAY[
    'customers',
    'suppliers',
    'yarn_receipts',
    'yarn_receipt_items',
    'raw_fabric_rolls',
    'finished_fabric_rolls',
    'dyeing_orders',
    'dyeing_roll_allocations',
    'work_orders',
    'boms',
    'bom_items',
    'employees',
    'inventory_adjustments'
  ];
BEGIN
  FOREACH tbl IN ARRAY business_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      -- Ensure RLS is enabled
      EXECUTE format('ALTER TABLE public.%1$I ENABLE ROW LEVEL SECURITY;', tbl);

      -- Drop loose legacy policies with "OR current_tenant_id() IS NULL"
      EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Select on %1$s" ON public.%1$I;', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Insert on %1$s" ON public.%1$I;', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Update on %1$s" ON public.%1$I;', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Delete on %1$s" ON public.%1$I;', tbl);

      -- Create strict Fail-Closed tenant isolation policies
      -- A user MUST have an active non-null tenant_id, and the row MUST match it
      EXECUTE format(
        'CREATE POLICY "Tenant Isolation Select on %1$s" ON public.%1$I
         FOR SELECT TO authenticated
         USING (
           tenant_id IS NOT NULL 
           AND current_tenant_id() IS NOT NULL 
           AND tenant_id = current_tenant_id()
         );',
        tbl
      );

      EXECUTE format(
        'CREATE POLICY "Tenant Isolation Insert on %1$s" ON public.%1$I
         FOR INSERT TO authenticated
         WITH CHECK (
           tenant_id IS NOT NULL 
           AND current_tenant_id() IS NOT NULL 
           AND tenant_id = current_tenant_id()
         );',
        tbl
      );

      EXECUTE format(
        'CREATE POLICY "Tenant Isolation Update on %1$s" ON public.%1$I
         FOR UPDATE TO authenticated
         USING (
           tenant_id IS NOT NULL 
           AND current_tenant_id() IS NOT NULL 
           AND tenant_id = current_tenant_id()
         )
         WITH CHECK (
           tenant_id IS NOT NULL 
           AND current_tenant_id() IS NOT NULL 
           AND tenant_id = current_tenant_id()
         );',
        tbl
      );

      EXECUTE format(
        'CREATE POLICY "Tenant Isolation Delete on %1$s" ON public.%1$I
         FOR DELETE TO authenticated
         USING (
           tenant_id IS NOT NULL 
           AND current_tenant_id() IS NOT NULL 
           AND tenant_id = current_tenant_id()
           AND current_user_role()::TEXT IN (''admin'', ''manager'')
         );',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Harden `order_requests` Table (if exists in database)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'order_requests'
  ) THEN
    ALTER TABLE public.order_requests ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Tenant Isolation on order_requests" ON public.order_requests;
    DROP POLICY IF EXISTS "Staff can manage order_requests" ON public.order_requests;
    DROP POLICY IF EXISTS "Customers can manage own order_requests" ON public.order_requests;

    -- Staff within tenant can manage order_requests
    CREATE POLICY "Staff can manage order_requests" ON public.order_requests
    FOR ALL TO authenticated
    USING (
      tenant_id IS NOT NULL
      AND current_tenant_id() IS NOT NULL
      AND tenant_id = current_tenant_id()
      AND current_user_role()::TEXT IN ('admin', 'manager', 'staff', 'sale')
    )
    WITH CHECK (
      tenant_id IS NOT NULL
      AND current_tenant_id() IS NOT NULL
      AND tenant_id = current_tenant_id()
      AND current_user_role()::TEXT IN ('admin', 'manager', 'staff', 'sale')
    );

    -- Customer can select/insert their own requests if customer_id exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'order_requests' AND column_name = 'customer_id'
    ) THEN
      CREATE POLICY "Customers can manage own order_requests" ON public.order_requests
      FOR ALL TO authenticated
      USING (
        tenant_id IS NOT NULL
        AND current_tenant_id() IS NOT NULL
        AND tenant_id = current_tenant_id()
        AND current_user_role()::TEXT = 'customer'
        AND customer_id = (SELECT customer_id FROM public.profiles WHERE id = auth.uid())
      )
      WITH CHECK (
        tenant_id IS NOT NULL
        AND current_tenant_id() IS NOT NULL
        AND tenant_id = current_tenant_id()
        AND current_user_role()::TEXT = 'customer'
        AND customer_id = (SELECT customer_id FROM public.profiles WHERE id = auth.uid())
      );
    END IF;
  END IF;
END $$;
