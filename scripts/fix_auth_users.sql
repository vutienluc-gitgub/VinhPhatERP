-- Fix NULL values in auth.users string columns to prevent Go database/sql scan errors
BEGIN;

-- 1. If email_change_token still exists and email_change_token_new also exists, drop deprecated email_change_token
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'email_change_token'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'email_change_token_new'
  ) THEN
    ALTER TABLE auth.users DROP COLUMN email_change_token;
  END IF;
END $$;

-- 2. Update all NULL values to '' matching Supabase Cloud conventions
UPDATE auth.users SET
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0),
  is_sso_user = COALESCE(is_sso_user, false),
  is_anonymous = COALESCE(is_anonymous, false);

-- 3. Set default values to '' so future inserts are never NULL
ALTER TABLE auth.users ALTER COLUMN email_change SET DEFAULT '';
ALTER TABLE auth.users ALTER COLUMN email_change_token_new SET DEFAULT '';
ALTER TABLE auth.users ALTER COLUMN email_change_token_current SET DEFAULT '';
ALTER TABLE auth.users ALTER COLUMN confirmation_token SET DEFAULT '';
ALTER TABLE auth.users ALTER COLUMN recovery_token SET DEFAULT '';
ALTER TABLE auth.users ALTER COLUMN phone_change SET DEFAULT '';
ALTER TABLE auth.users ALTER COLUMN phone_change_token SET DEFAULT '';
ALTER TABLE auth.users ALTER COLUMN reauthentication_token SET DEFAULT '';

-- 4. Check identities table as well
UPDATE auth.identities SET
  identity_data = COALESCE(identity_data, '{}'::jsonb);

COMMIT;
