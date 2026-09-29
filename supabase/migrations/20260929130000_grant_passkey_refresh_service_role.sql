-- Migration: Grant EXECUTE on passkey refresh RPCs to service_role
-- Date: 2026-09-29
-- Description: Repair execute privileges for the passkey refresh functions.
--
-- 20260929120000_passkey_refresh_tokens.sql created four SECURITY DEFINER
-- functions and stripped PUBLIC/anon/authenticated with `REVOKE ... FROM PUBLIC,
-- anon, authenticated`. Revoking the default from PUBLIC also removes the EXECUTE
-- that every role inherited through PUBLIC, service_role included. The server
-- calls these functions through PostgREST with the service_role key, so without
-- this grant every call fails with `permission denied for function` — which the
-- service's error classifier misreads as a missing function (503 not_configured).
--
-- Supabase does not set ALTER DEFAULT PRIVILEGES for service_role on functions,
-- so the grant must be explicit. This is additive and idempotent: re-granting an
-- existing privilege is a no-op.
--
-- Rule 19: these functions bypass RLS by design and must stay callable only by
-- the backend. Granting service_role (not anon/authenticated) preserves that.

GRANT EXECUTE ON FUNCTION public.rotate_passkey_refresh_token(text, text, timestamptz, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_passkey_refresh_family(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_passkey_refresh_for_credential(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_webauthn_challenge(text, text, uuid) TO service_role;
