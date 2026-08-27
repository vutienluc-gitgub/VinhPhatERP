-- Migration: 20260827180000_notification_platform_core.sql
-- Description: Core Notification Platform tables, RLS policies, and RPC functions for Vinh Phat ERP

-- 1. Create app_notifications table
CREATE TABLE IF NOT EXISTS public.app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Domain and event classification
    domain TEXT NOT NULL, -- 'purchasing', 'approval', 'inventory', 'finance', 'production', 'system'
    type TEXT NOT NULL,   -- 'po_approved', 'approval_required', 'low_stock_warning', etc.
    priority TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    
    -- Display summary
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    
    -- Entity Reference (Decoupled from URLs)
    entity_type TEXT NOT NULL, -- 'purchase_order', 'rfq', 'stock_item', 'payment_schedule', 'approval_request', 'work_order', 'dyeing_order'
    entity_id TEXT NOT NULL,
    action TEXT DEFAULT 'view',
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Lifecycle and Status
    read_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_notifications_user_unread 
    ON public.app_notifications(user_id) 
    WHERE read_at IS NULL AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_app_notifications_user_feed 
    ON public.app_notifications(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for app_notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.app_notifications;
CREATE POLICY "Users can view their own notifications"
    ON public.app_notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications read state" ON public.app_notifications;
CREATE POLICY "Users can update their own notifications read state"
    ON public.app_notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service and admins can insert notifications" ON public.app_notifications;
CREATE POLICY "Service and admins can insert notifications"
    ON public.app_notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 2. Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'all',
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_domain_event UNIQUE (user_id, domain, event_type)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage their notification preferences"
    ON public.notification_preferences
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Create notification_delivery_logs table
CREATE TABLE IF NOT EXISTS public.notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.app_notifications(id) ON DELETE CASCADE,
    channel TEXT NOT NULL, -- 'web_push', 'realtime'
    status TEXT NOT NULL,  -- 'pending', 'sent', 'delivered', 'failed', 'expired'
    response_code INT,
    error_message TEXT,
    attempt_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notification_delivery_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view logs for their own notifications" ON public.notification_delivery_logs;
CREATE POLICY "Users can view logs for their own notifications"
    ON public.notification_delivery_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.app_notifications n 
            WHERE n.id = notification_delivery_logs.notification_id 
              AND n.user_id = auth.uid()
        )
    );

-- 4. Atomic RPC Functions for Notification Management

-- 4.1. Mark single notification as read
CREATE OR REPLACE FUNCTION public.rpc_mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.app_notifications
    SET read_at = NOW()
    WHERE id = p_notification_id AND user_id = auth.uid() AND read_at IS NULL;
    
    RETURN FOUND;
END;
$$;

-- 4.2. Mark all notifications as read for current user
CREATE OR REPLACE FUNCTION public.rpc_mark_all_notifications_read()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated_count INT;
BEGIN
    UPDATE public.app_notifications
    SET read_at = NOW()
    WHERE user_id = auth.uid() AND read_at IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$;

-- 4.3. Get unread notification count
CREATE OR REPLACE FUNCTION public.rpc_get_unread_notification_count()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*)::INT INTO v_count
    FROM public.app_notifications
    WHERE user_id = auth.uid() AND read_at IS NULL AND archived_at IS NULL;
    
    RETURN COALESCE(v_count, 0);
END;
$$;

-- 4.4. Create notification helper RPC (idempotent)
CREATE OR REPLACE FUNCTION public.rpc_create_app_notification(
    p_user_id UUID,
    p_domain TEXT,
    p_type TEXT,
    p_title TEXT,
    p_body TEXT,
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_action TEXT DEFAULT 'view',
    p_priority TEXT DEFAULT 'normal',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.app_notifications (
        user_id,
        domain,
        type,
        title,
        body,
        entity_type,
        entity_id,
        action,
        priority,
        metadata
    ) VALUES (
        p_user_id,
        p_domain,
        p_type,
        p_title,
        p_body,
        p_entity_type,
        p_entity_id,
        COALESCE(p_action, 'view'),
        COALESCE(p_priority, 'normal'),
        COALESCE(p_metadata, '{}'::jsonb)
    ) RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.rpc_mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_mark_all_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_unread_notification_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_create_app_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
