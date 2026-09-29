-- Migration: Passkey Refresh Tokens (server-side session renewal)
-- Date: 2026-09-29
-- Description: Opaque, rotating refresh tokens for passkey sessions.
--
-- A passkey session's access token is minted by the Hono API (not GoTrue), so
-- GoTrue holds no refresh token for it and supabase-js can never renew it. This
-- table lets our own server issue and rotate a refresh token, with reuse
-- detection via token families.
--
-- Rule 19/24 notes:
--   * Tokens are stored as SHA-256 hashes only — the raw token never touches the DB.
--   * RLS grants nothing to `authenticated`; only `service_role` may read/write.
--     This table is not read by GoTrue, so Rule 24's DEFAULT '' convention for
--     auth.users string columns does not apply here (NOT NULL is stricter and the
--     alternative — DEFAULT '' — would collide on the UNIQUE token_hash).

-- 1. Table: passkey_refresh_tokens
CREATE TABLE IF NOT EXISTS public.passkey_refresh_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_id text NOT NULL,
    token_hash text NOT NULL UNIQUE,
    -- Tokens minted from the same login share a family. Rotating issues a new
    -- member; presenting an already-revoked member means the token leaked, so the
    -- whole family is revoked (see rotate_passkey_refresh_token).
    family_id uuid NOT NULL,
    rotated_from uuid REFERENCES public.passkey_refresh_tokens(id) ON DELETE SET NULL,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_passkey_refresh_user ON public.passkey_refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_passkey_refresh_family ON public.passkey_refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_passkey_refresh_expires ON public.passkey_refresh_tokens(expires_at);
-- Only live tokens matter for reuse detection; keep the partial index small.
CREATE INDEX IF NOT EXISTS idx_passkey_refresh_active
    ON public.passkey_refresh_tokens(family_id)
    WHERE revoked_at IS NULL;

ALTER TABLE public.passkey_refresh_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'passkey_refresh_tokens'
          AND policyname = 'Service role full access to passkey refresh tokens'
    ) THEN
        CREATE POLICY "Service role full access to passkey refresh tokens"
            ON public.passkey_refresh_tokens
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- 2. Atomic rotation RPC (Rule 6: multi-row mutation must be one locked transaction)
--
-- Rotation is a read-then-write across two rows; doing it from the client would
-- leave a window where a token is consumed but its replacement not yet stored.
-- This runs under a row lock so concurrent presentations of the same token
-- serialise, and the loser is reported as reuse.
CREATE OR REPLACE FUNCTION public.rotate_passkey_refresh_token(
    p_old_hash text,
    p_new_hash text,
    p_new_expires_at timestamptz,
    p_new_credential_id text
)
RETURNS TABLE (
    status text,
    user_id uuid,
    family_id uuid,
    credential_id text,
    expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_row public.passkey_refresh_tokens%ROWTYPE;
BEGIN
    SELECT * INTO v_row
    FROM public.passkey_refresh_tokens
    WHERE token_hash = p_old_hash
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::uuid, NULL::text, NULL::timestamptz;
        RETURN;
    END IF;

    -- A token that was already rotated or explicitly revoked is being replayed:
    -- revoke the whole family so the attacker and the victim both lose access.
    IF v_row.revoked_at IS NOT NULL THEN
        UPDATE public.passkey_refresh_tokens
        SET revoked_at = now()
        WHERE family_id = v_row.family_id AND revoked_at IS NULL;

        RETURN QUERY SELECT 'reuse'::text, v_row.user_id, v_row.family_id, v_row.credential_id, NULL::timestamptz;
        RETURN;
    END IF;

    IF v_row.expires_at <= now() THEN
        RETURN QUERY SELECT 'expired'::text, v_row.user_id, v_row.family_id, v_row.credential_id, v_row.expires_at;
        RETURN;
    END IF;

    IF v_row.credential_id IS DISTINCT FROM p_new_credential_id THEN
        -- Credential mismatch: the token was minted for a different authenticator.
        RETURN QUERY SELECT 'invalid'::text, v_row.user_id, v_row.family_id, v_row.credential_id, NULL::timestamptz;
        RETURN;
    END IF;

    UPDATE public.passkey_refresh_tokens
    SET revoked_at = now()
    WHERE id = v_row.id;

    INSERT INTO public.passkey_refresh_tokens (
        user_id, credential_id, token_hash, family_id, rotated_from, expires_at
    ) VALUES (
        v_row.user_id, p_new_credential_id, p_new_hash, v_row.family_id, v_row.id, p_new_expires_at
    );

    RETURN QUERY SELECT 'rotated'::text, v_row.user_id, v_row.family_id, p_new_credential_id, p_new_expires_at;
END;
$$;

-- 3. Revoke a whole family (logout / credential deletion). Idempotent.
CREATE OR REPLACE FUNCTION public.revoke_passkey_refresh_family(p_family_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_count integer;
BEGIN
    UPDATE public.passkey_refresh_tokens
    SET revoked_at = now()
    WHERE family_id = p_family_id AND revoked_at IS NULL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- 4. Revoke every family belonging to one credential (called when a passkey is deleted).
CREATE OR REPLACE FUNCTION public.revoke_passkey_refresh_for_credential(p_credential_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_count integer;
BEGIN
    UPDATE public.passkey_refresh_tokens
    SET revoked_at = now()
    WHERE credential_id = p_credential_id AND revoked_at IS NULL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- Only the server (service_role) may execute these; they bypass RLS by design.
REVOKE ALL ON FUNCTION public.rotate_passkey_refresh_token(text, text, timestamptz, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revoke_passkey_refresh_family(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revoke_passkey_refresh_for_credential(text) FROM PUBLIC, anon, authenticated;

-- 5. Bind authentication challenges to a credential (Rule 19)
--
-- verifyLogin previously picked the globally newest unexpired authentication
-- challenge, so a login for user A could be satisfied by a challenge issued for
-- user B. Recording the credential lets verification require a match, and the
-- consume RPC deletes it under a row lock so two concurrent verifications cannot
-- replay the same challenge.
ALTER TABLE public.webauthn_challenges
    ADD COLUMN IF NOT EXISTS credential_id text;

CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_credential
    ON public.webauthn_challenges(credential_id, type);

CREATE OR REPLACE FUNCTION public.consume_webauthn_challenge(
    p_type text,
    p_credential_id text,
    p_user_id uuid
)
RETURNS TABLE (id uuid, challenge text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_row public.webauthn_challenges%ROWTYPE;
BEGIN
    -- Pick the newest live challenge this credential is entitled to, then delete
    -- it in the same transaction: selection and consumption cannot interleave, so
    -- two concurrent verifications cannot both consume the same challenge.
    SELECT * INTO v_row
    FROM public.webauthn_challenges
    WHERE type = p_type
      AND expires_at > now()
      AND (credential_id IS NULL OR credential_id = p_credential_id)
      AND (user_id IS NULL OR user_id = p_user_id)
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    DELETE FROM public.webauthn_challenges WHERE id = v_row.id;

    RETURN QUERY SELECT v_row.id, v_row.challenge;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_webauthn_challenge(text, text, uuid) FROM PUBLIC, anon, authenticated;
