-- Migration: Create recurring_transactions table
-- Purpose: Store recurring expense templates (e.g. monthly rent, employee salary)
-- that automatically generate expense vouchers on schedule.

CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
  day_of_month INTEGER NOT NULL DEFAULT 1 CHECK (day_of_month BETWEEN 1 AND 31),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.payment_accounts(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT '',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_generated_date DATE,
  next_run_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient query of due transactions
CREATE INDEX IF NOT EXISTS idx_recurring_tx_active_next
  ON public.recurring_transactions (is_active, next_run_date)
  WHERE is_active = true;

-- Index for tenant filtering (RLS)
CREATE INDEX IF NOT EXISTS idx_recurring_tx_tenant
  ON public.recurring_transactions (tenant_id);

-- Enable RLS
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own tenant's data
CREATE POLICY "recurring_transactions_tenant_isolation"
  ON public.recurring_transactions
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at_recurring_transactions'
  ) THEN
    CREATE TRIGGER set_updated_at_recurring_transactions
      BEFORE UPDATE ON public.recurring_transactions
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_set_updated_at();
  END IF;
END;
$$;

-- Comment for documentation
COMMENT ON TABLE public.recurring_transactions IS 'Recurring expense templates that auto-generate expense vouchers on a schedule (monthly rent, salary, etc.)';
