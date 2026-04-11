-- Migration: Fix Customer Portal tenant_id
-- Backfill tenant_id cho customer profiles dang NULL
-- Nguyen nhan: Edge Function create-customer-account khong set tenant_id
-- khien current_tenant_id() tra ve NULL va RLS chan toan bo query.

-- 1. Backfill: lay tenant_id tu bang customers (cung customer_id)
UPDATE profiles p
SET tenant_id = c.tenant_id
FROM customers c
WHERE p.customer_id = c.id
  AND p.role = 'customer'
  AND p.tenant_id IS NULL
  AND c.tenant_id IS NOT NULL;

-- 2. Truong hop customers cung khong co tenant_id, dung default tenant
UPDATE profiles
SET tenant_id = (SELECT id FROM tenants WHERE slug = 'default')
WHERE role = 'customer'
  AND tenant_id IS NULL;
