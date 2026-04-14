-- Migration: Fix sync_account_balance trigger for multi-tenant support
-- Van de: Trigger cu tinh SUM tu toan bo tenant, khong loc theo tenant_id
-- Giai phap: Lay tenant_id tu payment_accounts roi dung de loc expenses/payments

CREATE OR REPLACE FUNCTION public.sync_account_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _account_id     UUID;
  _old_account_id UUID;
  _tenant_id      UUID;
BEGIN
  -- Xac dinh account can tinh lai
  IF TG_OP = 'DELETE' THEN
    _account_id := OLD.account_id;
  ELSE
    _account_id := NEW.account_id;
  END IF;

  -- Tinh lai so du cho account hien tai
  IF _account_id IS NOT NULL THEN

    -- Lay tenant_id cua account de loc chinh xac theo tenant
    SELECT tenant_id INTO _tenant_id
    FROM public.payment_accounts
    WHERE id = _account_id;

    UPDATE public.payment_accounts
    SET current_balance = initial_balance
      + COALESCE((
          SELECT SUM(amount)
          FROM public.payments
          WHERE account_id = _account_id
            AND (
              _tenant_id IS NULL
              OR tenant_id = _tenant_id
            )
        ), 0)
      - COALESCE((
          SELECT SUM(amount)
          FROM public.expenses
          WHERE account_id = _account_id
            AND (
              _tenant_id IS NULL
              OR tenant_id = _tenant_id
            )
        ), 0)
    WHERE id = _account_id;

  END IF;

  -- Xu ly truong hop UPDATE doi account: tinh lai account cu
  IF TG_OP = 'UPDATE' THEN
    _old_account_id := OLD.account_id;

    IF _old_account_id IS DISTINCT FROM _account_id
       AND _old_account_id IS NOT NULL
    THEN

      SELECT tenant_id INTO _tenant_id
      FROM public.payment_accounts
      WHERE id = _old_account_id;

      UPDATE public.payment_accounts
      SET current_balance = initial_balance
        + COALESCE((
            SELECT SUM(amount)
            FROM public.payments
            WHERE account_id = _old_account_id
              AND (
                _tenant_id IS NULL
                OR tenant_id = _tenant_id
              )
          ), 0)
        - COALESCE((
            SELECT SUM(amount)
            FROM public.expenses
            WHERE account_id = _old_account_id
              AND (
                _tenant_id IS NULL
                OR tenant_id = _tenant_id
              )
          ), 0)
      WHERE id = _old_account_id;

    END IF;
  END IF;

  RETURN NULL;
END;
$$;

-- Trigger da duoc gan tu truoc, khong can gan lai
-- (trg_expenses_sync_balance va trg_payments_sync_balance van hoat dong)

-- Tinh lai so du hien tai cho tat ca account (de dong bo sau migration)
UPDATE public.payment_accounts pa
SET current_balance = pa.initial_balance
  + COALESCE((
      SELECT SUM(p.amount)
      FROM public.payments p
      WHERE p.account_id = pa.id
        AND (pa.tenant_id IS NULL OR p.tenant_id = pa.tenant_id)
    ), 0)
  - COALESCE((
      SELECT SUM(e.amount)
      FROM public.expenses e
      WHERE e.account_id = pa.id
        AND (pa.tenant_id IS NULL OR e.tenant_id = pa.tenant_id)
    ), 0);
