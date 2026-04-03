-- Add 'sale' role to user_role enum (must be in separate transaction)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sale' AND enumtypid = 'user_role'::regtype) THEN
    ALTER TYPE user_role ADD VALUE 'sale';
  END IF;
END
$$;
