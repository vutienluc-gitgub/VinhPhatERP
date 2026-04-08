-- Migration: Create Debt Tables (Customer Debt & Transactions)
-- Purpose: Track customer receivables from shipments and other activities.

-- 1. Create debt_transaction_type enum
DO $$ BEGIN
    CREATE TYPE debt_transaction_type AS ENUM ('shipment', 'payment', 'adjustment', 'return_credit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create customer_debt table (Main balance)
CREATE TABLE IF NOT EXISTS public.customer_debt (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES public.tenants(id),
  customer_id    UUID NOT NULL REFERENCES public.customers(id),
  balance        NUMERIC(14,2) NOT NULL DEFAULT 0, -- Current outstanding balance
  credit_limit   NUMERIC(14,2) DEFAULT 0,          -- Max allowed debt
  notes          TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, tenant_id) -- One record per customer per tenant
);

-- 3. Create debt_transactions table (Audit log of changes)
CREATE TABLE IF NOT EXISTS public.debt_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id),
  customer_id     UUID NOT NULL REFERENCES public.customers(id),
  shipment_id     UUID REFERENCES public.shipments(id) ON DELETE SET NULL, -- Link to shipment
  invoice_id      UUID, -- Future: link to invoice
  type            debt_transaction_type NOT NULL,
  amount          NUMERIC(14,2) NOT NULL, -- Positive for new debt, negative for reduction
  balance_after   NUMERIC(14,2),          -- Audit: what was the balance after this?
  notes           TEXT,
  created_by      UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shipment_id, type) -- Block double counting from same shipment/type
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.customer_debt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- customer_debt
CREATE POLICY "Users can view their tenant's debt" ON public.customer_debt
  FOR SELECT USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- debt_transactions
CREATE POLICY "Users can view their tenant's debt transactions" ON public.debt_transactions
  FOR SELECT USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 6. Add updated_at trigger for customer_debt
CREATE TRIGGER trg_customer_debt_updated_at
  BEFORE UPDATE ON public.customer_debt
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7. Comments for clarity
COMMENT ON TABLE public.customer_debt IS 'Tổng hợp công nợ hiện tại của từng khách hàng.';
COMMENT ON TABLE public.debt_transactions IS 'Lịch sử từng lần biến động công nợ (Shipment, Thanh toán, Điều chỉnh).';
