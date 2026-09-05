-- Migration: Fix rpc_execute_approval_transaction for partial updates
-- Description: Check existence and UPDATE rather than INSERT ... ON CONFLICT with missing not-null columns

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
    v_req_id UUID;
    v_stp_id UUID;
BEGIN
    -- 1. Upsert Requests
    IF jsonb_array_length(p_requests) > 0 THEN
        FOR req IN SELECT * FROM jsonb_array_elements(p_requests)
        LOOP
            v_req_id := (req->>'id')::uuid;
            IF EXISTS (SELECT 1 FROM public.approval_requests WHERE id = v_req_id) THEN
                UPDATE public.approval_requests SET
                    status = COALESCE(req->>'status', status),
                    row_version = COALESCE((req->>'row_version')::int, row_version + 1),
                    updated_at = now()
                WHERE id = v_req_id;
            ELSE
                INSERT INTO public.approval_requests (
                    id, resource_type, resource_id, resource_version, workflow_id, workflow_version, status, snapshot_data, row_version, created_by
                ) VALUES (
                    v_req_id,
                    req->>'resource_type',
                    req->>'resource_id',
                    req->>'resource_version',
                    (req->>'workflow_id')::uuid,
                    (req->>'workflow_version')::int,
                    COALESCE(req->>'status', 'pending'),
                    COALESCE(req->'snapshot_data', '{}'::jsonb),
                    COALESCE((req->>'row_version')::int, 1),
                    (req->>'created_by')::uuid
                );
            END IF;
        END LOOP;
    END IF;

    -- 2. Upsert Steps
    IF jsonb_array_length(p_steps) > 0 THEN
        FOR stp IN SELECT * FROM jsonb_array_elements(p_steps)
        LOOP
            v_stp_id := (stp->>'id')::uuid;
            IF EXISTS (SELECT 1 FROM public.approval_steps WHERE id = v_stp_id) THEN
                UPDATE public.approval_steps SET
                    status = COALESCE(stp->>'status', status),
                    approver_snapshot = COALESCE(stp->'approver_snapshot', approver_snapshot),
                    comment = COALESCE(stp->>'comment', comment),
                    approved_at = COALESCE((stp->>'approved_at')::timestamptz, approved_at),
                    deadline = COALESCE((stp->>'deadline')::timestamptz, deadline),
                    is_overdue = COALESCE((stp->>'is_overdue')::boolean, is_overdue),
                    delegated_to_user_id = COALESCE((stp->>'delegated_to_user_id')::uuid, delegated_to_user_id),
                    role = COALESCE(stp->>'role', role)
                WHERE id = v_stp_id;
            ELSE
                INSERT INTO public.approval_steps (
                    id, request_id, step_order, role, role_name, status, approver_snapshot, comment, approved_at, is_parallel, deadline, is_overdue, delegated_to_user_id, sla_hours, escalation_action, escalation_role
                ) VALUES (
                    v_stp_id,
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
                );
            END IF;
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
