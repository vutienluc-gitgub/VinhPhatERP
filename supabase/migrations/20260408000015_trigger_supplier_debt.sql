-- Migration: Triggers for Supplier Debt Sync
-- Automatically track debt increases/decreases based on actions.

-- Type 1: Yarn Receipts
-- Status becomes 'confirmed' => Increase supplier debt
DROP FUNCTION IF EXISTS sync_yarn_receipt_debt() CASCADE;
CREATE OR REPLACE FUNCTION sync_yarn_receipt_debt()
RETURNS TRIGGER AS $$
DECLARE
  v_total_amount NUMERIC := 0;
  v_balance NUMERIC;
BEGIN
  -- Only act when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN

    IF NEW.total_amount > 0 THEN
      -- Create or update debt record
      INSERT INTO public.supplier_debt (tenant_id, supplier_id, balance)
      VALUES (NEW.tenant_id, NEW.supplier_id, NEW.total_amount)
      ON CONFLICT (supplier_id, tenant_id)
      DO UPDATE SET 
        balance = public.supplier_debt.balance + NEW.total_amount,
        updated_at = now()
      RETURNING balance INTO v_balance;

      -- Create transaction
      INSERT INTO public.supplier_debt_transactions (
        tenant_id,
        supplier_id,
        reference_id,
        reference_type,
        type,
        amount,
        balance_after,
        notes,
        created_by
      ) VALUES (
        NEW.tenant_id,
        NEW.supplier_id,
        NEW.id,
        'yarn_receipt',
        'purchase',
        NEW.total_amount,
        v_balance,
        'Nhập sợi - ' || NEW.receipt_number,
        NEW.created_by
      );
    END IF;

  -- Handle cancellation: Reverse debt
  ELSIF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN

    IF NEW.total_amount > 0 THEN
      UPDATE public.supplier_debt
      SET balance = GREATEST(0, balance - NEW.total_amount),
          updated_at = now()
      WHERE supplier_id = NEW.supplier_id AND tenant_id = NEW.tenant_id
      RETURNING balance INTO v_balance;

      INSERT INTO public.supplier_debt_transactions (
        tenant_id, supplier_id, reference_id, reference_type, type,
        amount, balance_after, notes, created_by
      ) VALUES (
        NEW.tenant_id, NEW.supplier_id, NEW.id, 'yarn_receipt', 'adjustment',
        -NEW.total_amount, v_balance, 'Hủy phiếu nhập sợi - ' || NEW.receipt_number, auth.uid()
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_yarn_receipt_sync_debt
  AFTER UPDATE ON public.yarn_receipts
  FOR EACH ROW EXECUTE FUNCTION sync_yarn_receipt_debt();


-- Type 2: Dyeing Orders
-- Status becomes 'completed' => Increase supplier debt
DROP FUNCTION IF EXISTS sync_dyeing_order_debt() CASCADE;
CREATE OR REPLACE FUNCTION sync_dyeing_order_debt()
RETURNS TRIGGER AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    IF NEW.total_amount > 0 THEN
      INSERT INTO public.supplier_debt (tenant_id, supplier_id, balance)
      VALUES (NEW.tenant_id, NEW.supplier_id, NEW.total_amount)
      ON CONFLICT (supplier_id, tenant_id)
      DO UPDATE SET 
        balance = public.supplier_debt.balance + NEW.total_amount,
        updated_at = now()
      RETURNING balance INTO v_balance;

      INSERT INTO public.supplier_debt_transactions (
        tenant_id, supplier_id, reference_id, reference_type, type,
        amount, balance_after, notes, created_by
      ) VALUES (
        NEW.tenant_id, NEW.supplier_id, NEW.id, 'dyeing_order', 'purchase',
        NEW.total_amount, v_balance, 'Gia công nhuộm - ' || NEW.dyeing_order_number, auth.uid()
      );
    END IF;

  ELSIF NEW.status = 'cancelled' AND OLD.status = 'completed' THEN
    IF NEW.total_amount > 0 THEN
      UPDATE public.supplier_debt
      SET balance = GREATEST(0, balance - NEW.total_amount),
          updated_at = now()
      WHERE supplier_id = NEW.supplier_id AND tenant_id = NEW.tenant_id
      RETURNING balance INTO v_balance;

      INSERT INTO public.supplier_debt_transactions (
        tenant_id, supplier_id, reference_id, reference_type, type,
        amount, balance_after, notes, created_by
      ) VALUES (
        NEW.tenant_id, NEW.supplier_id, NEW.id, 'dyeing_order', 'adjustment',
        -NEW.total_amount, v_balance, 'Hủy phiếu nhuộm - ' || NEW.dyeing_order_number, auth.uid()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dyeing_order_sync_debt
  AFTER UPDATE ON public.dyeing_orders
  FOR EACH ROW EXECUTE FUNCTION sync_dyeing_order_debt();


-- Type 3: Weaving Invoices
-- Invoices are created directly as 'completed/due' amounts effectively, so we trigger on INSERT
DROP FUNCTION IF EXISTS sync_weaving_invoice_debt() CASCADE;
CREATE OR REPLACE FUNCTION sync_weaving_invoice_debt()
RETURNS TRIGGER AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  IF NEW.total_amount > 0 THEN
    INSERT INTO public.supplier_debt (tenant_id, supplier_id, balance)
    VALUES (NEW.tenant_id, NEW.supplier_id, NEW.total_amount)
    ON CONFLICT (supplier_id, tenant_id)
    DO UPDATE SET 
      balance = public.supplier_debt.balance + NEW.total_amount,
      updated_at = now()
    RETURNING balance INTO v_balance;

    INSERT INTO public.supplier_debt_transactions (
      tenant_id, supplier_id, reference_id, reference_type, type,
      amount, balance_after, notes, created_by
    ) VALUES (
      NEW.tenant_id, NEW.supplier_id, NEW.id, 'weaving_invoice', 'purchase',
      NEW.total_amount, v_balance, 'Hóa đơn dệt - ' || NEW.invoice_number, auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_weaving_invoice_sync_debt
  AFTER INSERT ON public.weaving_invoices
  FOR EACH ROW EXECUTE FUNCTION sync_weaving_invoice_debt();
