-- Migration: Create Supplier Debt Tables
-- Purpose: Track supplier payables from purchases and activities.

-- 1. Create supplier_debt_transaction_type enum
DO $$ BEGIN
    CREATE TYPE supplier_debt_transaction_type AS ENUM ('purchase', 'payment', 'adjustment', 'return_credit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create supplier_debt table (Main balance)
CREATE TABLE IF NOT EXISTS public.supplier_debt (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES public.tenants(id),
  supplier_id    UUID NOT NULL REFERENCES public.suppliers(id),
  balance        NUMERIC(14,2) NOT NULL DEFAULT 0, -- Current outstanding balance we owe
  notes          TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, tenant_id) -- One record per supplier per tenant
);

-- 3. Create supplier_debt_transactions table (Audit log of changes)
CREATE TABLE IF NOT EXISTS public.supplier_debt_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id),
  supplier_id     UUID NOT NULL REFERENCES public.suppliers(id),
  reference_id    UUID, -- General reference to whatever caused it (yarn_receipt, work_order, etc.)
  reference_type  VARCHAR(50), -- E.g. 'yarn_receipt', 'weaving_invoice', 'dyeing_order'
  type            supplier_debt_transaction_type NOT NULL,
  amount          NUMERIC(14,2) NOT NULL, -- Positive for new debt we owe, negative for payment
  balance_after   NUMERIC(14,2),          -- Audit: what was the balance after this?
  notes           TEXT,
  created_by      UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.supplier_debt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_debt_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- supplier_debt
CREATE POLICY "Tenant isolation for supplier_debt" ON public.supplier_debt
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- supplier_debt_transactions
CREATE POLICY "Tenant isolation for supplier_debt_transactions" ON public.supplier_debt_transactions
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- 6. Add updated_at trigger for supplier_debt
CREATE TRIGGER trg_supplier_debt_updated_at
  BEFORE UPDATE ON public.supplier_debt
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7. Comments for clarity
COMMENT ON TABLE public.supplier_debt IS 'Tổng hợp công nợ hiện tại với từng nhà cung cấp.';
COMMENT ON TABLE public.supplier_debt_transactions IS 'Lịch sử từng lần biến động công nợ với nhà cung cấp (Mua hàng, Thanh toán, Điều chỉnh).';
