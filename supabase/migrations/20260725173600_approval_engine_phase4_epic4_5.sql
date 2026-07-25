-- Migration: Approval Engine Phase 4 - Epic 4 & 5
-- Description: Transactional Outbox & Notification System

-- 1. Create approval_outbox_events table
CREATE TABLE public.approval_outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processed, failed
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ
);
CREATE INDEX idx_approval_outbox_events_status ON public.approval_outbox_events(status);

-- 2. Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id UUID, -- null means it targets a role
    target_role VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notifications_target ON public.notifications(target_user_id, target_role, is_read);

-- 3. Create generic RPC for ACID transactions in Approval Engine
CREATE OR REPLACE FUNCTION public.rpc_execute_approval_transaction(
    p_requests JSONB DEFAULT '[]'::jsonb,
    p_steps JSONB DEFAULT '[]'::jsonb,
    p_histories JSONB DEFAULT '[]'::jsonb,
    p_outbox_events JSONB DEFAULT '[]'::jsonb
) RETURNS void AS $$
DECLARE
    req JSONB;
    stp JSONB;
    hist JSONB;
    evt JSONB;
BEGIN
    -- 1. Upsert Requests
    IF jsonb_array_length(p_requests) > 0 THEN
        FOR req IN SELECT * FROM jsonb_array_elements(p_requests)
        LOOP
            INSERT INTO public.approval_requests (
                id, resource_type, resource_id, resource_version, workflow_id, workflow_version, status, snapshot_data, row_version, created_by
            ) VALUES (
                (req->>'id')::uuid,
                req->>'resource_type',
                req->>'resource_id',
                req->>'resource_version',
                (req->>'workflow_id')::uuid,
                (req->>'workflow_version')::int,
                req->>'status',
                req->'snapshot_data',
                COALESCE((req->>'row_version')::int, 1),
                (req->>'created_by')::uuid
            )
            ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status,
                row_version = EXCLUDED.row_version,
                updated_at = now();
        END LOOP;
    END IF;

    -- 2. Upsert Steps
    IF jsonb_array_length(p_steps) > 0 THEN
        FOR stp IN SELECT * FROM jsonb_array_elements(p_steps)
        LOOP
            INSERT INTO public.approval_steps (
                id, request_id, step_order, role, role_name, status, approver_snapshot, comment, approved_at, is_parallel, deadline, is_overdue, delegated_to_user_id, sla_hours, escalation_action, escalation_role
            ) VALUES (
                (stp->>'id')::uuid,
                (stp->>'request_id')::uuid,
                (stp->>'step_order')::int,
                stp->>'role',
                stp->>'role_name',
                COALESCE(stp->>'status', 'pending'),
                stp->'approver_snapshot',
                stp->>'comment',
                (stp->>'approved_at')::timestamptz,
                COALESCE((stp->>'is_parallel')::boolean, false),
                (stp->>'deadline')::timestamptz,
                COALESCE((stp->>'is_overdue')::boolean, false),
                (stp->>'delegated_to_user_id')::uuid,
                (stp->>'sla_hours')::numeric,
                stp->>'escalation_action',
                stp->>'escalation_role'
            )
            ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status,
                approver_snapshot = EXCLUDED.approver_snapshot,
                comment = EXCLUDED.comment,
                approved_at = EXCLUDED.approved_at,
                deadline = EXCLUDED.deadline,
                is_overdue = EXCLUDED.is_overdue,
                delegated_to_user_id = EXCLUDED.delegated_to_user_id,
                role = EXCLUDED.role;
        END LOOP;
    END IF;

    -- 3. Insert Histories
    IF jsonb_array_length(p_histories) > 0 THEN
        FOR hist IN SELECT * FROM jsonb_array_elements(p_histories)
        LOOP
            INSERT INTO public.approval_histories (
                request_id, event_type, actor_snapshot, payload
            ) VALUES (
                (hist->>'request_id')::uuid,
                hist->>'event_type',
                hist->'actor_snapshot',
                COALESCE(hist->'payload', '{}'::jsonb)
            );
        END LOOP;
    END IF;

    -- 4. Insert Outbox Events
    IF jsonb_array_length(p_outbox_events) > 0 THEN
        FOR evt IN SELECT * FROM jsonb_array_elements(p_outbox_events)
        LOOP
            INSERT INTO public.approval_outbox_events (
                event_type, payload
            ) VALUES (
                evt->>'event_type',
                evt->'payload'
            );
        END LOOP;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
