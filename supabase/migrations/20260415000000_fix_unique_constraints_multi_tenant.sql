-- ============================================================
-- MIGRATION: Fix UNIQUE Constraints for Multi-Tenant
-- ============================================================
-- Purpose: Convert all UNIQUE(code/number) constraints to UNIQUE(code/number, tenant_id)
-- This allows each tenant to have their own fabric codes, yarn codes, order numbers, etc.
-- ============================================================
-- 1. fabric_catalogs: code UNIQUE → UNIQUE(code, tenant_id)
ALTER TABLE public.fabric_catalogs DROP CONSTRAINT IF EXISTS fabric_catalogs_code_key;
ALTER TABLE public.fabric_catalogs
ADD CONSTRAINT fabric_catalogs_code_tenant_id_key UNIQUE (code, tenant_id);
-- 2. yarn_catalogs: code UNIQUE → UNIQUE(code, tenant_id)
ALTER TABLE public.yarn_catalogs DROP CONSTRAINT IF EXISTS yarn_catalogs_code_key;
ALTER TABLE public.yarn_catalogs
ADD CONSTRAINT yarn_catalogs_code_tenant_id_key UNIQUE (code, tenant_id);
-- 3. bom_templates: code UNIQUE → UNIQUE(code, tenant_id)
ALTER TABLE public.bom_templates DROP CONSTRAINT IF EXISTS bom_templates_code_key;
ALTER TABLE public.bom_templates
ADD CONSTRAINT bom_templates_code_tenant_id_key UNIQUE (code, tenant_id);
-- 4. yarn_receipts: receipt_number UNIQUE → UNIQUE(receipt_number, tenant_id)
ALTER TABLE public.yarn_receipts DROP CONSTRAINT IF EXISTS yarn_receipts_receipt_number_key;
ALTER TABLE public.yarn_receipts
ADD CONSTRAINT yarn_receipts_receipt_number_tenant_id_key UNIQUE (receipt_number, tenant_id);
-- 5. raw_fabric_rolls: roll_number UNIQUE → UNIQUE(roll_number, tenant_id)
ALTER TABLE public.raw_fabric_rolls DROP CONSTRAINT IF EXISTS raw_fabric_rolls_roll_number_key;
ALTER TABLE public.raw_fabric_rolls
ADD CONSTRAINT raw_fabric_rolls_roll_number_tenant_id_key UNIQUE (roll_number, tenant_id);
-- 6. finished_fabric_rolls: roll_number UNIQUE → UNIQUE(roll_number, tenant_id)
ALTER TABLE public.finished_fabric_rolls DROP CONSTRAINT IF EXISTS finished_fabric_rolls_roll_number_key;
ALTER TABLE public.finished_fabric_rolls
ADD CONSTRAINT finished_fabric_rolls_roll_number_tenant_id_key UNIQUE (roll_number, tenant_id);
-- 7. orders: order_number UNIQUE → UNIQUE(order_number, tenant_id)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_number_key;
ALTER TABLE public.orders
ADD CONSTRAINT orders_order_number_tenant_id_key UNIQUE (order_number, tenant_id);
-- 8. shipments: shipment_number UNIQUE → UNIQUE(shipment_number, tenant_id)
ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_shipment_number_key;
ALTER TABLE public.shipments
ADD CONSTRAINT shipments_shipment_number_tenant_id_key UNIQUE (shipment_number, tenant_id);
-- 9. payments: payment_number UNIQUE → UNIQUE(payment_number, tenant_id)
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_number_key;
ALTER TABLE public.payments
ADD CONSTRAINT payments_payment_number_tenant_id_key UNIQUE (payment_number, tenant_id);
-- Notes:
-- - settings table (key UNIQUE) remains unchanged - it's global company config, not per-tenant
-- - order_progress already has UNIQUE(order_id, stage) which is correct - order_id is tenant-scoped