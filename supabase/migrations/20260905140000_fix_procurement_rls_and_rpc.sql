-- ============================================================
-- Migration: Fix Procurement RLS Policies & Atomic RPC
-- Date: 2026-09-05
-- Tables: purchase_requests, purchase_request_items, sourcing_rfqs, sourcing_rfq_items
-- ============================================================

-- 1. Set DEFAULT tenant_id
ALTER TABLE public.purchase_requests ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE public.purchase_request_items ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE public.sourcing_rfqs ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE public.sourcing_rfq_items ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();

-- 2. Fix RLS Policies
DROP POLICY IF EXISTS "Tenant isolation for purchase_requests" ON public.purchase_requests;
CREATE POLICY "Tenant isolation for purchase_requests" ON public.purchase_requests
  FOR ALL USING (
    tenant_id = public.current_tenant_id() OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager', 'staff'))
  );

DROP POLICY IF EXISTS "Tenant isolation for purchase_request_items" ON public.purchase_request_items;
CREATE POLICY "Tenant isolation for purchase_request_items" ON public.purchase_request_items
  FOR ALL USING (
    tenant_id = public.current_tenant_id() OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager', 'staff'))
  );

DROP POLICY IF EXISTS "Tenant isolation for sourcing_rfqs" ON public.sourcing_rfqs;
CREATE POLICY "Tenant isolation for sourcing_rfqs" ON public.sourcing_rfqs
  FOR ALL USING (
    tenant_id = public.current_tenant_id() OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager', 'staff'))
  );

DROP POLICY IF EXISTS "Tenant isolation for sourcing_rfq_items" ON public.sourcing_rfq_items;
CREATE POLICY "Tenant isolation for sourcing_rfq_items" ON public.sourcing_rfq_items
  FOR ALL USING (
    tenant_id = public.current_tenant_id() OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager', 'staff'))
  );

-- 3. Helper: Next PR Number Generator
CREATE OR REPLACE FUNCTION next_pr_no()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_num INT;
  v_prefix TEXT;
  v_pr_no TEXT;
BEGIN
  v_prefix := 'PR-' || to_char(CURRENT_DATE, 'YYYYMM') || '-';
  SELECT COALESCE(MAX(SUBSTRING(pr_no FROM LENGTH(v_prefix) + 1)::INT), 0) + 1
  INTO v_next_num
  FROM public.purchase_requests
  WHERE pr_no LIKE v_prefix || '%';

  v_pr_no := v_prefix || LPAD(v_next_num::TEXT, 4, '0');
  RETURN v_pr_no;
END;
$$;

-- 4. Atomic RPC: Create Purchase Request (Header + Items)
CREATE OR REPLACE FUNCTION rpc_create_purchase_request(
  p_requester_dept VARCHAR,
  p_priority VARCHAR,
  p_notes TEXT,
  p_items JSONB,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pr_id UUID;
  v_pr_no TEXT;
  v_tenant_id UUID;
  v_item JSONB;
BEGIN
  v_tenant_id := public.current_tenant_id();
  IF v_tenant_id IS NULL THEN
    SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'quantri' LIMIT 1;
  END IF;

  IF p_created_by IS NULL THEN
    p_created_by := auth.uid();
  END IF;

  v_pr_no := next_pr_no();

  INSERT INTO public.purchase_requests (
    tenant_id,
    pr_no,
    requester_dept,
    priority,
    status,
    notes,
    created_by
  ) VALUES (
    v_tenant_id,
    v_pr_no,
    p_requester_dept,
    COALESCE(p_priority, 'normal'),
    'draft',
    p_notes,
    p_created_by
  ) RETURNING id INTO v_pr_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.purchase_request_items (
      tenant_id,
      pr_id,
      material_id,
      material_name,
      material_specs,
      qty_required,
      uom,
      expected_date,
      purpose
    ) VALUES (
      v_tenant_id,
      v_pr_id,
      CASE WHEN (v_item->>'material_id') IS NOT NULL AND (v_item->>'material_id') <> '' THEN (v_item->>'material_id')::UUID ELSE NULL END,
      COALESCE(v_item->>'material_name', 'Vật tư'),
      v_item->>'material_specs',
      COALESCE((v_item->>'qty_required')::DECIMAL, 0),
      COALESCE(v_item->>'uom', 'kg'),
      CASE WHEN (v_item->>'expected_date') IS NOT NULL AND (v_item->>'expected_date') <> '' THEN (v_item->>'expected_date')::DATE ELSE NULL END,
      v_item->>'purpose'
    );
  END LOOP;

  RETURN v_pr_id;
END;
$$;
