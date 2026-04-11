-- ============================================================
-- Migration: Fix RLS Data Isolation for Customer Portal
-- ============================================================
-- Vấn đề: Policy "Authenticated users can read <table>" dùng USING(true)
-- cho phép TẤT CẢ authenticated user (kể cả customer role) thấy
-- toàn bộ dữ liệu. Policy customer_portal_* bị vô hiệu hóa do OR logic.
--
-- Fix: Thay policy USING(true) bằng policy chỉ cho phép staff roles.
-- Customer role sẽ chỉ được đọc qua policy customer_portal_* riêng.
-- ============================================================

-- Bảng cần isolate cho customer portal
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['orders', 'order_items', 'order_progress', 'payments', 'shipments', 'shipment_items'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Xóa policy cũ USING(true) — đây là nguyên nhân data leak
    EXECUTE format(
      'DROP POLICY IF EXISTS "Authenticated users can read %1$s" ON %1$s;',
      tbl
    );
    
    EXECUTE format(
      'DROP POLICY IF EXISTS "Staff can read %1$s" ON %1$s;',
      tbl
    );

    -- Tạo lại policy cho staff roles (KHÔNG bao gồm customer)
    EXECUTE format(
      'CREATE POLICY "Staff can read %1$s" ON %1$s
       FOR SELECT TO authenticated
       USING (current_user_role() IN (''admin'', ''manager'', ''staff'', ''driver'', ''viewer'', ''sale''));',
      tbl
    );

    RAISE NOTICE 'Fixed SELECT policy for %', tbl;
  END LOOP;
END
$$;

-- Xác nhận: các bảng không liên quan customer portal vẫn giữ USING(true)
-- vì customer role không truy cập các bảng đó.
