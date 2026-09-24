-- Migration: 20260923180000_revoke_stale_vapid_push_subscriptions.sql
-- Description: The VAPID key pair was rotated on 2026-09-16 (commit 80a5d18c). Any push
--              subscription created before that moment was minted with the retired public
--              key, so the push gateway rejects it with VapidPkHashMismatch. Those rows were
--              left active and kept consuming outbox retries (one chat message exhausted all
--              5 attempts) while the recipient never saw a notification.
--
--              created_at is a reliable key-era marker: the client upsert never rewrites it,
--              and a device that re-subscribes always registers a brand-new endpoint
--              (therefore a new row) because the old endpoint cannot be reused.
--
--              Revoking (not deleting) keeps the audit trail. The client's key-drift
--              recovery clears revoked_at automatically when the device next opens the app
--              and re-subscribes with the current key, so this is self-healing.

UPDATE public.push_subscriptions
SET revoked_at = now(),
    updated_at = now()
WHERE revoked_at IS NULL
  AND created_at < TIMESTAMPTZ '2026-09-16 07:39:45+00';
