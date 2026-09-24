-- Migration: 20260923170000_add_is_standalone_to_push_subscriptions.sql
-- Description: Track whether a Web Push subscription was created from an installed
--              standalone PWA (critical on iOS, where push only works in Home Screen mode).
--              The client (push-subscription.repository.ts) already writes this column;
--              without it PostgREST rejects the upsert and push never activates.

ALTER TABLE public.push_subscriptions
    ADD COLUMN IF NOT EXISTS is_standalone BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.push_subscriptions.is_standalone IS
    'True when subscription was created from an installed standalone PWA (required for iOS 16.4+ Web Push).';
