-- Migration: Expense Allocations for Invoice Matching

-- 1. Create document_type enum if needed, or just use text check
CREATE TYPE payment_document_type AS ENUM ('weaving_invoice', 'yarn_receipt');

-- 2. Add payment columns to weaving_invoices
ALTER TABLE public.weaving_invoices
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(15,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS payment_status TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN total_amount <= 0 THEN 'paid'
      WHEN paid_amount >= total_amount THEN 'paid'
      WHEN paid_amount > 0 THEN 'partial'
      ELSE 'unpaid'
    END
  ) STORED;

-- 3. Add payment columns to yarn_receipts
ALTER TABLE public.yarn_receipts
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(15,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS payment_status TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN total_amount <= 0 THEN 'paid'
      WHEN paid_amount >= total_amount THEN 'paid'
      WHEN paid_amount > 0 THEN 'partial'
      ELSE 'unpaid'
    END
  ) STORED;

-- 4. Create expense_allocations table
CREATE TABLE IF NOT EXISTS public.expense_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  document_type payment_document_type NOT NULL,
  document_id UUID NOT NULL,
  allocated_amount NUMERIC(15,2) NOT NULL CHECK (allocated_amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_allocations_expense ON public.expense_allocations(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_allocations_document ON public.expense_allocations(document_type, document_id);

ALTER TABLE public.expense_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for expense_allocations" ON public.expense_allocations
  FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

-- 5. Trigger to update paid_amount on documents
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
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.document_type = 'weaving_invoice' THEN
      UPDATE public.weaving_invoices SET paid_amount = paid_amount - OLD.allocated_amount WHERE id = OLD.document_id;
    ELSIF OLD.document_type = 'yarn_receipt' THEN
      UPDATE public.yarn_receipts SET paid_amount = paid_amount - OLD.allocated_amount WHERE id = OLD.document_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Revert old, apply new
    IF OLD.document_type = 'weaving_invoice' THEN
      UPDATE public.weaving_invoices SET paid_amount = paid_amount - OLD.allocated_amount WHERE id = OLD.document_id;
    ELSIF OLD.document_type = 'yarn_receipt' THEN
      UPDATE public.yarn_receipts SET paid_amount = paid_amount - OLD.allocated_amount WHERE id = OLD.document_id;
    END IF;

    IF NEW.document_type = 'weaving_invoice' THEN
      UPDATE public.weaving_invoices SET paid_amount = paid_amount + NEW.allocated_amount WHERE id = NEW.document_id;
    ELSIF NEW.document_type = 'yarn_receipt' THEN
      UPDATE public.yarn_receipts SET paid_amount = paid_amount + NEW.allocated_amount WHERE id = NEW.document_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trg_expense_allocations_sync_document
  AFTER INSERT OR UPDATE OR DELETE ON public.expense_allocations
  FOR EACH ROW EXECUTE FUNCTION trg_update_document_paid_amount();

-- 6. Update rpc_create_expense to handle allocations
CREATE OR REPLACE FUNCTION atomic_create_expense(
  p_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_expense_number TEXT;
  v_tenant UUID := current_tenant_id();
  v_result JSONB;
  v_expense_id UUID;
  v_alloc JSONB;
  v_allocation_total NUMERIC := 0;
BEGIN
  v_expense_number := generate_next_doc_number(
    'expenses', 'expense_number', 'PC' || to_char(now(), 'YYMM') || '-', 4
  );

  INSERT INTO expenses (
    expense_number, category, amount, expense_date,
    account_id, supplier_id, employee_id,
    description, reference_number, notes, tenant_id
  ) VALUES (
    v_expense_number,
    (p_data->>'category')::expense_category,
    (p_data->>'amount')::NUMERIC,
    (p_data->>'expense_date')::DATE,
    NULLIF(p_data->>'account_id', '')::UUID,
    NULLIF(p_data->>'supplier_id', '')::UUID,
    NULLIF(p_data->>'employee_id', '')::UUID,
    p_data->>'description',
    p_data->>'reference_number',
    p_data->>'notes',
    v_tenant
  ) RETURNING id INTO v_expense_id;

  -- Process allocations if provided
  IF p_data ? 'allocations' AND jsonb_array_length(p_data->'allocations') > 0 THEN
    FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_data->'allocations')
    LOOP
      INSERT INTO expense_allocations (
        expense_id, document_type, document_id, allocated_amount, tenant_id
      ) VALUES (
        v_expense_id,
        (v_alloc->>'document_type')::payment_document_type,
        (v_alloc->>'document_id')::UUID,
        (v_alloc->>'allocated_amount')::NUMERIC,
        v_tenant
      );
      v_allocation_total := v_allocation_total + (v_alloc->>'allocated_amount')::NUMERIC;
    END LOOP;

    -- Validate allocation total vs expense amount
    IF v_allocation_total > (p_data->>'amount')::NUMERIC THEN
      RAISE EXCEPTION 'Allocation total (%) cannot exceed expense amount (%)', v_allocation_total, (p_data->>'amount')::NUMERIC;
    END IF;
  END IF;

  SELECT to_jsonb(t) INTO v_result
  FROM expenses t
  WHERE t.id = v_expense_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Define view for unpaid documents to show in UI
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
WHERE status = 'confirmed' AND payment_status != 'paid';
