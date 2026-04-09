-- Migration: Fix supplier debt triggers to handle NULL tenant_id
-- Problem: yarn_receipts rows created without tenant_id cause the
--          sync_yarn_receipt_debt trigger to fail with:
--          "null value in column tenant_id of relation supplier_debt violates not-null constraint"
-- Solution: Use COALESCE(NEW.tenant_id, current_tenant_id()) as fallback,
--           and backfill existing rows missing tenant_id.

-- ============================================================
-- Step 1: Backfill NULL tenant_id on yarn_receipts
-- ============================================================
UPDATE public.yarn_receipts
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'default')
WHERE tenant_id IS NULL;

UPDATE public.yarn_receipt_items
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'default')
WHERE tenant_id IS NULL;

-- ============================================================
-- Step 2: Recreate sync_yarn_receipt_debt with COALESCE fallback
-- ============================================================
DROP FUNCTION IF EXISTS sync_yarn_receipt_debt() CASCADE;

CREATE OR REPLACE FUNCTION sync_yarn_receipt_debt()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant UUID;
  v_balance NUMERIC;
BEGIN
  -- Resolve tenant_id: prefer row value, fallback to current user's tenant
  v_tenant := COALESCE(NEW.tenant_id, public.current_tenant_id());

  IF v_tenant IS NULL THEN
    RAISE WARNING 'sync_yarn_receipt_debt: cannot resolve tenant_id for receipt %', NEW.id;
    RETURN NEW;
  END IF;

  -- Status changes to 'confirmed' => Increase supplier debt
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    IF NEW.total_amount > 0 THEN
      INSERT INTO public.supplier_debt (tenant_id, supplier_id, balance)
      VALUES (v_tenant, NEW.supplier_id, NEW.total_amount)
      ON CONFLICT (supplier_id, tenant_id)
      DO UPDATE SET
        balance = public.supplier_debt.balance + NEW.total_amount,
        updated_at = now()
      RETURNING balance INTO v_balance;

      INSERT INTO public.supplier_debt_transactions (
        tenant_id, supplier_id, reference_id, reference_type,
        type, amount, balance_after, notes, created_by
      ) VALUES (
        v_tenant, NEW.supplier_id, NEW.id, 'yarn_receipt',
        'purchase', NEW.total_amount, v_balance,
        'Nhập sợi - ' || NEW.receipt_number, NEW.created_by
      );
    END IF;

  -- Cancellation: Reverse debt
  ELSIF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    IF NEW.total_amount > 0 THEN
      UPDATE public.supplier_debt
      SET balance = GREATEST(0, balance - NEW.total_amount),
          updated_at = now()
      WHERE supplier_id = NEW.supplier_id AND tenant_id = v_tenant
      RETURNING balance INTO v_balance;

      INSERT INTO public.supplier_debt_transactions (
        tenant_id, supplier_id, reference_id, reference_type, type,
        amount, balance_after, notes, created_by
      ) VALUES (
        v_tenant, NEW.supplier_id, NEW.id, 'yarn_receipt', 'adjustment',
        -NEW.total_amount, v_balance,
        'Hủy phiếu nhập sợi - ' || NEW.receipt_number, auth.uid()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_yarn_receipt_sync_debt
  AFTER UPDATE ON public.yarn_receipts
  FOR EACH ROW EXECUTE FUNCTION sync_yarn_receipt_debt();


-- ============================================================
-- Step 3: Fix sync_dyeing_order_debt (same pattern)
-- ============================================================
DROP FUNCTION IF EXISTS sync_dyeing_order_debt() CASCADE;

CREATE OR REPLACE FUNCTION sync_dyeing_order_debt()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant UUID;
  v_balance NUMERIC;
BEGIN
  v_tenant := COALESCE(NEW.tenant_id, public.current_tenant_id());

  IF v_tenant IS NULL THEN
    RAISE WARNING 'sync_dyeing_order_debt: cannot resolve tenant_id for %', NEW.id;
    RETURN NEW;
  END IF;

  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    IF NEW.total_amount > 0 THEN
      INSERT INTO public.supplier_debt (tenant_id, supplier_id, balance)
      VALUES (v_tenant, NEW.supplier_id, NEW.total_amount)
      ON CONFLICT (supplier_id, tenant_id)
      DO UPDATE SET
        balance = public.supplier_debt.balance + NEW.total_amount,
        updated_at = now()
      RETURNING balance INTO v_balance;

      INSERT INTO public.supplier_debt_transactions (
        tenant_id, supplier_id, reference_id, reference_type, type,
        amount, balance_after, notes, created_by
      ) VALUES (
        v_tenant, NEW.supplier_id, NEW.id, 'dyeing_order', 'purchase',
        NEW.total_amount, v_balance,
        'Gia công nhuộm - ' || NEW.dyeing_order_number, auth.uid()
      );
    END IF;

  ELSIF NEW.status = 'cancelled' AND OLD.status = 'completed' THEN
    IF NEW.total_amount > 0 THEN
      UPDATE public.supplier_debt
      SET balance = GREATEST(0, balance - NEW.total_amount),
          updated_at = now()
      WHERE supplier_id = NEW.supplier_id AND tenant_id = v_tenant
      RETURNING balance INTO v_balance;

      INSERT INTO public.supplier_debt_transactions (
        tenant_id, supplier_id, reference_id, reference_type, type,
        amount, balance_after, notes, created_by
      ) VALUES (
        v_tenant, NEW.supplier_id, NEW.id, 'dyeing_order', 'adjustment',
        -NEW.total_amount, v_balance,
        'Hủy phiếu nhuộm - ' || NEW.dyeing_order_number, auth.uid()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dyeing_order_sync_debt
  AFTER UPDATE ON public.dyeing_orders
  FOR EACH ROW EXECUTE FUNCTION sync_dyeing_order_debt();


-- ============================================================
-- Step 4: Fix sync_weaving_invoice_debt (same pattern)
-- ============================================================
DROP FUNCTION IF EXISTS sync_weaving_invoice_debt() CASCADE;

CREATE OR REPLACE FUNCTION sync_weaving_invoice_debt()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant UUID;
  v_balance NUMERIC;
BEGIN
  v_tenant := COALESCE(NEW.tenant_id, public.current_tenant_id());

  IF v_tenant IS NULL THEN
    RAISE WARNING 'sync_weaving_invoice_debt: cannot resolve tenant_id for %', NEW.id;
    RETURN NEW;
  END IF;

  IF NEW.total_amount > 0 THEN
    INSERT INTO public.supplier_debt (tenant_id, supplier_id, balance)
    VALUES (v_tenant, NEW.supplier_id, NEW.total_amount)
    ON CONFLICT (supplier_id, tenant_id)
    DO UPDATE SET
      balance = public.supplier_debt.balance + NEW.total_amount,
      updated_at = now()
    RETURNING balance INTO v_balance;

    INSERT INTO public.supplier_debt_transactions (
      tenant_id, supplier_id, reference_id, reference_type, type,
      amount, balance_after, notes, created_by
    ) VALUES (
      v_tenant, NEW.supplier_id, NEW.id, 'weaving_invoice', 'purchase',
      NEW.total_amount, v_balance,
      'Hóa đơn dệt - ' || NEW.invoice_number, auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_weaving_invoice_sync_debt
  AFTER INSERT ON public.weaving_invoices
  FOR EACH ROW EXECUTE FUNCTION sync_weaving_invoice_debt();
