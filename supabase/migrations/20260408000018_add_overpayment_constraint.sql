-- Migration: Validate overpayment constraint
-- This migration adds a CHECK constraint on the orders table to ensure
-- that the total paid_amount never exceeds the total_amount.
-- Because of the existing trg_payments_sync_paid trigger, any payment
-- that would cause paid_amount to exceed total_amount will naturally 
-- trigger this constraint and fail the transaction.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'orders_valid_paid_amount_check'
    ) THEN
        -- Ensure existing data complies before adding constraint
        UPDATE public.orders SET paid_amount = total_amount WHERE paid_amount > total_amount;

        ALTER TABLE public.orders
        ADD CONSTRAINT orders_valid_paid_amount_check CHECK (paid_amount <= total_amount);
    END IF;
END $$;
