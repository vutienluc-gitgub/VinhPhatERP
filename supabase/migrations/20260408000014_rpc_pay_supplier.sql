-- Migration: Pay Supplier Debt RPC
-- Allows paying a supplier's debt and records a payment transaction.

DROP FUNCTION IF EXISTS pay_supplier_debt(uuid, numeric, text);

CREATE OR REPLACE FUNCTION pay_supplier_debt(
  p_supplier_id UUID,
  p_amount NUMERIC,
  p_notes TEXT
) RETURNS VOID AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_tenant_id UUID;
BEGIN
  -- Get tenant_id from profile (assumes auth.uid() is set)
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();

  -- Lock the row to avoid race conditions
  SELECT balance INTO v_current_balance
  FROM public.supplier_debt
  WHERE supplier_id = p_supplier_id AND tenant_id = v_tenant_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'Supplier debt record not found for supplier %', p_supplier_id;
  END IF;

  -- Calculate new balance (allow overpayment, but practically it's just paying off debt)
  v_new_balance := GREATEST(0, v_current_balance - p_amount);

  -- Update balance
  UPDATE public.supplier_debt
  SET balance = v_new_balance,
      updated_at = now()
  WHERE supplier_id = p_supplier_id AND tenant_id = v_tenant_id;

  -- Insert audit transaction (type = 'payment')
  INSERT INTO public.supplier_debt_transactions (
    tenant_id,
    supplier_id,
    type,
    amount,
    balance_after,
    notes,
    created_by
  ) VALUES (
    v_tenant_id,
    p_supplier_id,
    'payment',
    p_amount,
    v_new_balance,
    p_notes,
    auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon/public role (adjust as needed)
GRANT EXECUTE ON FUNCTION public.pay_supplier_debt(uuid, numeric, text) TO anon, authenticated;
