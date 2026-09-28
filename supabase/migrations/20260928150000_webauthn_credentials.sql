-- Migration: WebAuthn / Passkeys Credentials & Challenges
-- Date: 2026-09-28
-- Description: Self-hosted WebAuthn / Passkeys authentication tables for VinhPhatERP

-- 1. Table: webauthn_credentials
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id text NOT NULL,
    credential_id text UNIQUE NOT NULL,
    public_key text NOT NULL,
    counter bigint NOT NULL DEFAULT 0,
    transports text[] DEFAULT '{}'::text[],
    device_type text DEFAULT 'single_device',
    backed_up boolean DEFAULT false,
    friendly_name text DEFAULT 'Thiết bị bảo mật',
    created_at timestamptz NOT NULL DEFAULT now(),
    last_used_at timestamptz
);

-- Indexes for webauthn_credentials
CREATE INDEX IF NOT EXISTS idx_webauthn_cred_user_id ON public.webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_cred_employee_id ON public.webauthn_credentials(employee_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_cred_credential_id ON public.webauthn_credentials(credential_id);

-- Enable RLS for webauthn_credentials
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'webauthn_credentials' AND policyname = 'Users can view own webauthn credentials'
    ) THEN
        CREATE POLICY "Users can view own webauthn credentials"
            ON public.webauthn_credentials
            FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'webauthn_credentials' AND policyname = 'Users can delete own webauthn credentials'
    ) THEN
        CREATE POLICY "Users can delete own webauthn credentials"
            ON public.webauthn_credentials
            FOR DELETE
            TO authenticated
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'webauthn_credentials' AND policyname = 'Service role full access to webauthn credentials'
    ) THEN
        CREATE POLICY "Service role full access to webauthn credentials"
            ON public.webauthn_credentials
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- 2. Table: webauthn_challenges (temporary storage with TTL to prevent replay attacks)
CREATE TABLE IF NOT EXISTS public.webauthn_challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id text,
    type text NOT NULL CHECK (type IN ('registration', 'authentication')),
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for webauthn_challenges
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_lookup ON public.webauthn_challenges(challenge, type, expires_at);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user ON public.webauthn_challenges(user_id, type);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_employee ON public.webauthn_challenges(employee_id, type);

-- Enable RLS for webauthn_challenges
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'webauthn_challenges' AND policyname = 'Service role full access to webauthn challenges'
    ) THEN
        CREATE POLICY "Service role full access to webauthn challenges"
            ON public.webauthn_challenges
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;
