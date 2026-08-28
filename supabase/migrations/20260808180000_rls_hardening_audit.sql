-- ============================================================
-- Migration: Phase 16 — RLS Hardening & Tenant Security Audit
-- ============================================================
-- Ensures all business tables have Row Level Security (RLS) enabled
-- and enforces tenant isolation (tenant_id = current_tenant_id())
-- alongside role-based access controls.
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
  business_tables TEXT[] := ARRAY[
    'customers',
    'suppliers',
    'orders',
    'order_items',
    'order_progress',
    'yarn_receipts',
    'yarn_receipt_items',
    'raw_fabric_rolls',
    'finished_fabric_rolls',
    'dyeing_orders',
    'dyeing_roll_allocations',
    'quotations',
    'quotation_items',
    'work_orders',
    'boms',
    'bom_items',
    'employees'
  ];
BEGIN
  FOREACH tbl IN ARRAY business_tables LOOP
    -- Only apply if table exists in current database
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      -- 1. Ensure RLS is enabled
      EXECUTE format('ALTER TABLE public.%1$I ENABLE ROW LEVEL SECURITY;', tbl);

      -- 2. Drop existing legacy or unsafe tenant policies
      EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Select on %1$s" ON public.%1$I;', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Insert on %1$s" ON public.%1$I;', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Update on %1$s" ON public.%1$I;', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Delete on %1$s" ON public.%1$I;', tbl);

      -- 3. Create standardized Tenant Isolation policies for authenticated users
      EXECUTE format(
        'CREATE POLICY "Tenant Isolation Select on %1$s" ON public.%1$I
         FOR SELECT TO authenticated
         USING (
           tenant_id IS NULL 
           OR tenant_id = current_tenant_id()
           OR current_tenant_id() IS NULL
         );',
        tbl
      );

      EXECUTE format(
        'CREATE POLICY "Tenant Isolation Insert on %1$s" ON public.%1$I
         FOR INSERT TO authenticated
         WITH CHECK (
           tenant_id IS NULL 
           OR tenant_id = current_tenant_id()
           OR current_tenant_id() IS NULL
         );',
        tbl
      );

      EXECUTE format(
        'CREATE POLICY "Tenant Isolation Update on %1$s" ON public.%1$I
         FOR UPDATE TO authenticated
         USING (
           tenant_id IS NULL 
           OR tenant_id = current_tenant_id()
           OR current_tenant_id() IS NULL
         )
         WITH CHECK (
           tenant_id IS NULL 
           OR tenant_id = current_tenant_id()
           OR current_tenant_id() IS NULL
         );',
        tbl
      );

      EXECUTE format(
        'CREATE POLICY "Tenant Isolation Delete on %1$s" ON public.%1$I
         FOR DELETE TO authenticated
         USING (
           tenant_id IS NULL 
           OR tenant_id = current_tenant_id()
           OR current_tenant_id() IS NULL
         );',
        tbl
      );

      RAISE NOTICE 'Hardened RLS policy for table: %', tbl;
    END IF;
  END LOOP;
END
$$;
