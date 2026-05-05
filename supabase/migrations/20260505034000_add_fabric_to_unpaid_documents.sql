-- Migration: Add finished_fabric_rolls to unpaid documents workflow
-- Problem: v_supplier_debt includes fabric purchases but v_unpaid_documents doesn't,
-- so the "Đối trừ công nợ" section in ExpenseForm never shows fabric debt.

-- 1. Add paid_amount + payment_status to finished_fabric_rolls (same pattern as weaving_invoices/yarn_receipts)
ALTER TABLE public.finished_fabric_rolls
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(15,2) DEFAULT 0 NOT NULL;

-- payment_status as generated column (matches existing pattern)
-- Cannot use ADD COLUMN IF NOT EXISTS with GENERATED, so check first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'finished_fabric_rolls'
      AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.finished_fabric_rolls
      ADD COLUMN payment_status TEXT GENERATED ALWAYS AS (
        CASE
          WHEN COALESCE(purchase_price, 0) * COALESCE(weight_kg, 0) <= 0 THEN 'paid'
          WHEN paid_amount >= COALESCE(purchase_price, 0) * COALESCE(weight_kg, 0) THEN 'paid'
          WHEN paid_amount > 0 THEN 'partial'
          ELSE 'unpaid'
        END
      ) STORED;
  END IF;
END $$;

-- 2. Add 'fabric_purchase' to payment_document_type enum
ALTER TYPE payment_document_type ADD VALUE IF NOT EXISTS 'fabric_purchase';

-- 3. Update trigger to handle fabric_purchase allocations
CREATE OR REPLACE FUNCTION trg_update_document_paid_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.document_type = 'weaving_invoice' THEN
      UPDATE public.weaving_invoices SET paid_amount = paid_amount + NEW.allocated_amount WHERE id = NEW.document_id;
    ELSIF NEW.document_type = 'yarn_receipt' THEN
      UPDATE public.yarn_receipts SET paid_amount = paid_amount + NEW.allocated_amount WHERE id = NEW.document_id;
    ELSIF NEW.document_type = 'fabric_purchase' THEN
      UPDATE public.finished_fabric_rolls SET paid_amount = paid_amount + NEW.allocated_amount WHERE id = NEW.document_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.document_type = 'weaving_invoice' THEN
      UPDATE public.weaving_invoices SET paid_amount = paid_amount - OLD.allocated_amount WHERE id = OLD.document_id;
    ELSIF OLD.document_type = 'yarn_receipt' THEN
      UPDATE public.yarn_receipts SET paid_amount = paid_amount - OLD.allocated_amount WHERE id = OLD.document_id;
    ELSIF OLD.document_type = 'fabric_purchase' THEN
      UPDATE public.finished_fabric_rolls SET paid_amount = paid_amount - OLD.allocated_amount WHERE id = OLD.document_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Revert old
    IF OLD.document_type = 'weaving_invoice' THEN
      UPDATE public.weaving_invoices SET paid_amount = paid_amount - OLD.allocated_amount WHERE id = OLD.document_id;
    ELSIF OLD.document_type = 'yarn_receipt' THEN
      UPDATE public.yarn_receipts SET paid_amount = paid_amount - OLD.allocated_amount WHERE id = OLD.document_id;
    ELSIF OLD.document_type = 'fabric_purchase' THEN
      UPDATE public.finished_fabric_rolls SET paid_amount = paid_amount - OLD.allocated_amount WHERE id = OLD.document_id;
    END IF;
    -- Apply new
    IF NEW.document_type = 'weaving_invoice' THEN
      UPDATE public.weaving_invoices SET paid_amount = paid_amount + NEW.allocated_amount WHERE id = NEW.document_id;
    ELSIF NEW.document_type = 'yarn_receipt' THEN
      UPDATE public.yarn_receipts SET paid_amount = paid_amount + NEW.allocated_amount WHERE id = NEW.document_id;
    ELSIF NEW.document_type = 'fabric_purchase' THEN
      UPDATE public.finished_fabric_rolls SET paid_amount = paid_amount + NEW.allocated_amount WHERE id = NEW.document_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

-- 4. Update v_unpaid_documents to include finished_fabric_rolls
DROP VIEW IF EXISTS v_unpaid_documents CASCADE;
CREATE OR REPLACE VIEW v_unpaid_documents AS
SELECT
  'weaving_invoice' as document_type,
  id as document_id,
  invoice_number as document_number,
  supplier_id,
  invoice_date as document_date,
  total_amount,
  paid_amount,
  (total_amount - paid_amount) as remaining_amount,
  tenant_id
FROM weaving_invoices
WHERE status = 'confirmed' AND payment_status != 'paid'
UNION ALL
SELECT
  'yarn_receipt' as document_type,
  id as document_id,
  receipt_number as document_number,
  supplier_id,
  receipt_date as document_date,
  total_amount,
  paid_amount,
  (total_amount - paid_amount) as remaining_amount,
  tenant_id
FROM yarn_receipts
WHERE status = 'confirmed' AND payment_status != 'paid'
UNION ALL
SELECT
  'fabric_purchase' as document_type,
  id as document_id,
  roll_number as document_number,
  supplier_id,
  COALESCE(production_date, created_at::date) as document_date,
  COALESCE(purchase_price, 0) * COALESCE(weight_kg, 0) as total_amount,
  paid_amount,
  (COALESCE(purchase_price, 0) * COALESCE(weight_kg, 0) - paid_amount) as remaining_amount,
  tenant_id
FROM finished_fabric_rolls
WHERE supplier_id IS NOT NULL
  AND purchase_price IS NOT NULL
  AND purchase_price > 0
  AND payment_status != 'paid';
