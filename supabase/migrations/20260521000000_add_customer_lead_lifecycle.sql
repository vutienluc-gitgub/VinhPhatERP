-- ============================================================
-- Migration: Add Customer Lead Lifecycle
-- Description: Adds CRM lead_status column to customers and automatic transition triggers
-- ============================================================

-- 1. Add lead_status column to customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS lead_status TEXT NOT NULL DEFAULT 'lead'
  CONSTRAINT chk_customers_lead_status CHECK (lead_status IN ('lead', 'opportunity', 'customer', 'lost'));

CREATE INDEX IF NOT EXISTS idx_customers_lead_status ON public.customers(lead_status);

COMMENT ON COLUMN public.customers.lead_status IS 'CRM lead lifecycle status: lead (tiềm năng), opportunity (báo giá/thương lượng), customer (đã ký hợp đồng), lost (thất bại)';

-- 2. Trigger function to auto-transition customer lead_status to 'opportunity' on Quotation insertion
CREATE OR REPLACE FUNCTION public.fn_trg_quotation_auto_lead_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto promote customer lead_status from 'lead' or 'lost' to 'opportunity' on quotation insertion
  UPDATE public.customers
  SET lead_status = 'opportunity'
  WHERE id = NEW.customer_id
    AND lead_status IN ('lead', 'lost');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for quotation insertion
DROP TRIGGER IF EXISTS trg_quotation_insert_lead_status ON public.quotations;
CREATE TRIGGER trg_quotation_insert_lead_status
  AFTER INSERT ON public.quotations
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_trg_quotation_auto_lead_status();

-- 3. Trigger function to auto-transition customer lead_status to 'customer' on Contract signed
CREATE OR REPLACE FUNCTION public.fn_trg_contract_auto_lead_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When a contract status transitions to 'signed' and party_a_type is 'customer', update that customer's lead_status to 'customer'
  IF NEW.status = 'signed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) AND NEW.party_a_type = 'customer' THEN
    UPDATE public.customers
    SET lead_status = 'customer'
    WHERE id = NEW.party_a_id
      AND lead_status IS DISTINCT FROM 'customer';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for contract updates
DROP TRIGGER IF EXISTS trg_contract_update_lead_status ON public.contracts;
CREATE TRIGGER trg_contract_update_lead_status
  AFTER INSERT OR UPDATE OF status ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_trg_contract_auto_lead_status();
