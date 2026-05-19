-- =============================================================================
-- Migration: Add salesperson assignment to customers + assignment history
-- =============================================================================

-- 1. Add salesperson_id to customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS salesperson_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_salesperson ON public.customers(salesperson_id);

COMMENT ON COLUMN public.customers.salesperson_id IS
  'Nhan vien kinh doanh phu trach khach hang nay';

-- 2. Create assignment history table
CREATE TABLE IF NOT EXISTS public.customer_assignment_history (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES public.tenants(id),
  customer_id   UUID        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  from_salesperson_id UUID  REFERENCES public.employees(id) ON DELETE SET NULL,
  to_salesperson_id   UUID  REFERENCES public.employees(id) ON DELETE SET NULL,
  assigned_by   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason        TEXT
);

CREATE INDEX IF NOT EXISTS idx_cah_customer   ON public.customer_assignment_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_cah_to_sales   ON public.customer_assignment_history(to_salesperson_id);
CREATE INDEX IF NOT EXISTS idx_cah_assigned_at ON public.customer_assignment_history(assigned_at DESC);

-- 3. RLS for assignment history
ALTER TABLE public.customer_assignment_history ENABLE ROW LEVEL SECURITY;

-- Restrictive tenant isolation
CREATE POLICY tenant_isolation_customer_assignment_history
  ON public.customer_assignment_history
  AS RESTRICTIVE FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Staff can read
CREATE POLICY "Staff can read customer_assignment_history"
  ON public.customer_assignment_history
  FOR SELECT TO authenticated
  USING (current_user_role() IN ('admin','manager','staff','driver','viewer','sale'));

-- Staff can insert (triggered by system)
CREATE POLICY "Staff can insert customer_assignment_history"
  ON public.customer_assignment_history
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin','manager','staff'));

-- 4. Trigger function: auto-log assignment changes
CREATE OR REPLACE FUNCTION log_customer_assignment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- On INSERT: log if salesperson_id is set
  IF TG_OP = 'INSERT' AND NEW.salesperson_id IS NOT NULL THEN
    INSERT INTO public.customer_assignment_history
      (tenant_id, customer_id, from_salesperson_id, to_salesperson_id, assigned_by, reason)
    VALUES (
      COALESCE(NEW.tenant_id, public.current_tenant_id()),
      NEW.id,
      NULL,
      NEW.salesperson_id,
      auth.uid(),
      'Gan nhan vien phu trach khi tao khach hang'
    );
  END IF;

  -- On UPDATE: log if salesperson_id changed
  IF TG_OP = 'UPDATE'
     AND (OLD.salesperson_id IS DISTINCT FROM NEW.salesperson_id) THEN
    INSERT INTO public.customer_assignment_history
      (tenant_id, customer_id, from_salesperson_id, to_salesperson_id, assigned_by, reason)
    VALUES (
      COALESCE(NEW.tenant_id, public.current_tenant_id()),
      NEW.id,
      OLD.salesperson_id,
      NEW.salesperson_id,
      auth.uid(),
      CASE
        WHEN NEW.salesperson_id IS NULL THEN 'Go bo nhan vien phu trach'
        WHEN OLD.salesperson_id IS NULL THEN 'Gan nhan vien phu trach'
        ELSE 'Chuyen nhan vien phu trach'
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_customer_assignment_history
  AFTER INSERT OR UPDATE OF salesperson_id ON public.customers
  FOR EACH ROW EXECUTE FUNCTION log_customer_assignment();
