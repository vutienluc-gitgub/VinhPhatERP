-- ============================================================
-- Migration: Fix Global RLS Isolation
-- ============================================================
-- Đây là bản vá toàn diện (Comprehensive Fix) cho lỗi Customer A 
-- nhìn thấy dữ liệu của Customer B.
--
-- Nguyên nhân:
-- 1. `tenant_isolation_<table_name>` được tạo dưới dạng PERMISSIVE. 
--    Việc này dẫn đến: ai pass được điều kiện tenant_id thì được full quyền.
-- 2. "Authenticated users can read" được tạo với USING(true).
--
-- Cách giải quyết:
-- 1. Đổi `tenant_isolation_<table_name>` thành `AS RESTRICTIVE`.
--    Nó sẽ đóng vai trò như một bộ lọc (AND clause) cho mọi câu query.
-- 2. Đổi policy đọc mặc định thành "Staff can read" để customer 
--    không đọc được toàn bộ bảng, mà phải qua `customer_portal_*`.
-- ============================================================

DO $$
DECLARE
  t TEXT;
  business_tables TEXT[] := ARRAY[
    'customers',
    'orders', 'order_items', 'order_progress',
    'quotations', 'quotation_items',
    'shipments', 'shipment_items',
    'payments', 'expenses', 'accounts',
    'suppliers',
    'yarn_catalogs', 'yarn_receipts', 'yarn_receipt_items',
    'fabric_catalogs', 'raw_fabric_rolls', 'finished_fabric_rolls',
    'bom_templates', 'bom_yarn_items', 'bom_versions',
    'work_orders', 'work_order_y_requirements',
    'weaving_invoices', 'weaving_invoice_rolls',
    'inventory_movements',
    'shipping_rates',
    'company_settings'
  ];
  policy_name TEXT;
BEGIN
  FOREACH t IN ARRAY business_tables
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      
      -- 1. Sửa tenant_isolation thành AS RESTRICTIVE
      policy_name := 'tenant_isolation_' || t;
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id())',
        policy_name, t
      );

      -- 2. Xóa policy đọc toàn bộ (USING true)
      EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can read %s" ON public.%I', t, t);
      
      -- 3. Tạo policy đọc dành riêng cho Staff
      EXECUTE format('DROP POLICY IF EXISTS "Staff can read %s" ON public.%I', t, t);
      EXECUTE format(
        'CREATE POLICY "Staff can read %s" ON public.%I FOR SELECT TO authenticated USING (current_user_role() IN (''admin'',''manager'',''staff'',''driver'',''viewer'',''sale''))',
        t, t
      );
      
    END IF;
  END LOOP;
END
$$;
