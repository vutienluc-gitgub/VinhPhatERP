-- ============================================================
-- MIGRATION: Fix UNIQUE Constraints for Multi-Tenant (Part 2)
-- ============================================================
-- Purpose: Convert remaining global UNIQUE(code/number) constraints 
-- to UNIQUE(code/number, tenant_id) so each tenant can have their own sequences.
-- ============================================================

-- 1. customers: code
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_code_key;
ALTER TABLE public.customers ADD CONSTRAINT customers_code_tenant_id_key UNIQUE (code, tenant_id);

-- 2. suppliers: code
ALTER TABLE public.suppliers DROP CONSTRAINT IF EXISTS suppliers_code_key;
ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_code_tenant_id_key UNIQUE (code, tenant_id);

-- 3. employees: code
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_code_key;
ALTER TABLE public.employees ADD CONSTRAINT employees_code_tenant_id_key UNIQUE (code, tenant_id);

-- 4. work_orders: work_order_number
ALTER TABLE public.work_orders DROP CONSTRAINT IF EXISTS work_orders_work_order_number_key;
ALTER TABLE public.work_orders ADD CONSTRAINT work_orders_work_order_number_tenant_id_key UNIQUE (work_order_number, tenant_id);

-- 5. weaving_invoices: invoice_number
ALTER TABLE public.weaving_invoices DROP CONSTRAINT IF EXISTS weaving_invoices_invoice_number_key;
ALTER TABLE public.weaving_invoices ADD CONSTRAINT weaving_invoices_invoice_number_tenant_id_key UNIQUE (invoice_number, tenant_id);

-- 6. dyeing_orders: dyeing_order_number
ALTER TABLE public.dyeing_orders DROP CONSTRAINT IF EXISTS dyeing_orders_dyeing_order_number_key;
ALTER TABLE public.dyeing_orders ADD CONSTRAINT dyeing_orders_dyeing_order_number_tenant_id_key UNIQUE (dyeing_order_number, tenant_id);

-- 7. contracts: contract_number
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_contract_number_key;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_contract_number_tenant_id_key UNIQUE (contract_number, tenant_id);

-- 8. expenses: expense_number
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_expense_number_key;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_expense_number_tenant_id_key UNIQUE (expense_number, tenant_id);

-- 9. quotations: quotation_number
ALTER TABLE public.quotations DROP CONSTRAINT IF EXISTS quotations_quotation_number_key;
ALTER TABLE public.quotations ADD CONSTRAINT quotations_quotation_number_tenant_id_key UNIQUE (quotation_number, tenant_id);
