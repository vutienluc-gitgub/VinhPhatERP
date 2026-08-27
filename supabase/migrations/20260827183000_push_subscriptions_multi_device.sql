-- Migration: 20260827183000_push_subscriptions_multi_device.sql
-- Description: Multi-device Web Push Subscriptions table and RLS policies

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- W3C Push Subscription credentials
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    
    -- Device identity & metadata
    device_id TEXT NOT NULL,
    device_name TEXT,
    platform TEXT NOT NULL, -- 'ios', 'android', 'macos', 'windows', 'linux', 'other'
    browser TEXT NOT NULL,  -- 'safari-pwa', 'chrome', 'edge', 'firefox', 'other'
    user_agent TEXT,
    
    -- Status & Lifecycle
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for active subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subs_user_active 
    ON public.push_subscriptions(user_id) 
    WHERE revoked_at IS NULL;

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view their own push subscriptions"
    ON public.push_subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can create their own push subscriptions"
    ON public.push_subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update their own push subscriptions"
    ON public.push_subscriptions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete their own push subscriptions"
    ON public.push_subscriptions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
