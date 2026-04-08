-- ============================================================
-- MIGRATION: Add Multi-tenant Support (tenant_id + RLS)
-- ============================================================
-- Run this migration in Supabase SQL Editor.
-- This adds tenant_id to all business tables and creates
-- RLS policies for automatic data isolation.
-- ============================================================

-- Step 1: Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,               -- subdomain: 'hoaluc', 'vinhphat'
  name TEXT NOT NULL,                       -- display name: 'Hoa Lực', 'Vĩnh Phát'
  settings JSONB DEFAULT '{}',             -- custom settings per tenant
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tenant
INSERT INTO public.tenants (slug, name)
VALUES ('default', 'Vĩnh Phát')
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Add tenant_id column to profiles (links user to tenant)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Set existing profiles to default tenant
UPDATE public.profiles
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'default')
WHERE tenant_id IS NULL;

-- Step 3: Create helper function to get current user's tenant_id
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Step 4: Add tenant_id to all business tables
-- (Using a DO block to handle tables that may not exist yet)

DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'customers',
    'orders',
    'order_items',
    'order_progress',
    'quotations',
    'quotation_items',
    'shipments',
    'shipment_items',
    'payments',
    'expenses',
    'accounts',
    'suppliers',
    'yarn_catalogs',
    'yarn_receipts',
    'yarn_receipt_items',
    'fabric_catalogs',
    'raw_fabric_rolls',
    'finished_fabric_rolls',
    'bom_templates',
    'bom_yarn_items',
    'bom_versions',
    'work_orders',
    'work_order_y_requirements',
    'weaving_invoices',
    'weaving_invoice_rolls',
    'inventory_movements',
    'shipping_rates',
    'company_settings'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    -- Check if table exists before altering
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      -- Add column if not exists
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = t AND column_name = 'tenant_id'
      ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN tenant_id UUID REFERENCES public.tenants(id)', t);
        -- Set existing rows to default tenant
        EXECUTE format('UPDATE public.%I SET tenant_id = (SELECT id FROM public.tenants WHERE slug = ''default'') WHERE tenant_id IS NULL', t);
        RAISE NOTICE 'Added tenant_id to %', t;
      END IF;
    ELSE
      RAISE NOTICE 'Table % does not exist, skipping', t;
    END IF;
  END LOOP;
END
$$;

-- Step 5: Create RLS policies for tenant isolation
-- Enable RLS on all tables and create policies

DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'customers',
    'orders',
    'order_items',
    'order_progress',
    'quotations',
    'quotation_items',
    'shipments',
    'shipment_items',
    'payments',
    'expenses',
    'accounts',
    'suppliers',
    'yarn_catalogs',
    'yarn_receipts',
    'yarn_receipt_items',
    'fabric_catalogs',
    'raw_fabric_rolls',
    'finished_fabric_rolls',
    'bom_templates',
    'bom_yarn_items',
    'bom_versions',
    'work_orders',
    'work_order_y_requirements',
    'weaving_invoices',
    'weaving_invoice_rolls',
    'inventory_movements',
    'shipping_rates',
    'company_settings'
  ];
  t TEXT;
  policy_name TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      -- Enable RLS
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

      -- Drop existing tenant policy if any (for idempotency)
      policy_name := 'tenant_isolation_' || t;
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, t);

      -- Create SELECT/INSERT/UPDATE/DELETE policy
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id())',
        policy_name, t
      );

      RAISE NOTICE 'RLS enabled for %', t;
    END IF;
  END LOOP;
END
$$;

-- Step 6: Create index for performance
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'customers', 'orders', 'order_items', 'quotations', 'quotation_items',
    'shipments', 'shipment_items', 'payments', 'suppliers',
    'yarn_catalogs', 'yarn_receipts', 'raw_fabric_rolls', 'finished_fabric_rolls',
    'bom_templates', 'work_orders', 'weaving_invoices', 'inventory_movements'
  ];
  t TEXT;
  idx_name TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    idx_name := 'idx_' || t || '_tenant_id';
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'tenant_id') THEN
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (tenant_id)', idx_name, t);
    END IF;
  END LOOP;
END
$$;
