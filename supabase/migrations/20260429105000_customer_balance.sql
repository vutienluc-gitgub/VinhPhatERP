-- Migration: Add Customer Balance and Advance Payments

-- 1. Add account_balance to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS account_balance numeric(18,2) NOT NULL DEFAULT 0;

-- 2. Add customer_balance to payment_method enum
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'customer_balance';

-- 3. Make order_id nullable in payments
ALTER TABLE payments ALTER COLUMN order_id DROP NOT NULL;

-- 4. Update sync_order_paid_amount to ignore NULL order_id
CREATE OR REPLACE FUNCTION sync_order_paid_amount()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF old.order_id IS NOT NULL THEN
      UPDATE orders
      SET paid_amount = (
        SELECT COALESCE(sum(amount), 0)
        FROM payments
        WHERE order_id = old.order_id
      )
      WHERE id = old.order_id;
    END IF;
  ELSE
    IF new.order_id IS NOT NULL THEN
      UPDATE orders
      SET paid_amount = (
        SELECT COALESCE(sum(amount), 0)
        FROM payments
        WHERE order_id = new.order_id
      )
      WHERE id = new.order_id;
    END IF;
    -- Handle UPDATE where order_id changed
    IF TG_OP = 'UPDATE' AND old.order_id IS DISTINCT FROM new.order_id AND old.order_id IS NOT NULL THEN
      UPDATE orders
      SET paid_amount = (
        SELECT COALESCE(sum(amount), 0)
        FROM payments
        WHERE order_id = old.order_id
      )
      WHERE id = old.order_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

-- 5. Trigger to handle account_balance logic
CREATE OR REPLACE FUNCTION handle_customer_balance()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- For DELETE
  IF TG_OP = 'DELETE' THEN
    IF old.order_id IS NULL THEN
      -- Was an advance payment deposit, now removed -> deduct balance
      UPDATE customers SET account_balance = account_balance - old.amount WHERE id = old.customer_id;
    ELSIF old.payment_method = 'customer_balance' THEN
      -- Was paying order using balance, now removed -> refund balance
      UPDATE customers SET account_balance = account_balance + old.amount WHERE id = old.customer_id;
    END IF;
    RETURN NULL;
  END IF;

  -- For INSERT
  IF TG_OP = 'INSERT' THEN
    IF new.order_id IS NULL THEN
      -- Money deposited
      UPDATE customers SET account_balance = account_balance + new.amount WHERE id = new.customer_id;
    ELSIF new.payment_method = 'customer_balance' THEN
      -- Order paid via balance
      UPDATE customers SET account_balance = account_balance - new.amount WHERE id = new.customer_id;
    END IF;
    RETURN NULL;
  END IF;

  -- For UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Reverse OLD
    IF old.order_id IS NULL THEN
      UPDATE customers SET account_balance = account_balance - old.amount WHERE id = old.customer_id;
    ELSIF old.payment_method = 'customer_balance' THEN
      UPDATE customers SET account_balance = account_balance + old.amount WHERE id = old.customer_id;
    END IF;

    -- Apply NEW
    IF new.order_id IS NULL THEN
      UPDATE customers SET account_balance = account_balance + new.amount WHERE id = new.customer_id;
    ELSIF new.payment_method = 'customer_balance' THEN
      UPDATE customers SET account_balance = account_balance - new.amount WHERE id = new.customer_id;
    END IF;
    RETURN NULL;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_customer_balance ON payments;
CREATE TRIGGER trg_payments_customer_balance
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION handle_customer_balance();
