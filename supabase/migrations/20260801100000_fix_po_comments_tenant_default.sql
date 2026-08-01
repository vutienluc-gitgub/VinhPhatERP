-- Fix tenant_id missing DEFAULT in purchase_order_comments table

ALTER TABLE public.purchase_order_comments 
ALTER COLUMN tenant_id 
SET DEFAULT (current_setting('app.current_tenant_id', true))::uuid;
