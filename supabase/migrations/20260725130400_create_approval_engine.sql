-- Migration: Create Enterprise Approval Engine tables
-- Description: Core tables for the Approval Engine MVP

-- 1. Approval Workflows
CREATE TABLE public.approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_key VARCHAR(100) NOT NULL,
    version INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(workflow_key, version)
);

-- 2. Approval Workflow Steps
CREATE TABLE public.approval_workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    step_order INT NOT NULL,
    description TEXT,
    UNIQUE(workflow_id, step_order)
);

-- 3. Approval Requests
CREATE TABLE public.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    resource_version VARCHAR(100),
    workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id) ON DELETE RESTRICT,
    workflow_version INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- draft, pending, approved, rejected, cancelled
    snapshot_data JSONB NOT NULL DEFAULT '{"document": {}, "workflow": {}, "approvers": {}, "metadata": {}}'::jsonb,
    row_version INT NOT NULL DEFAULT 1,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(resource_type, resource_id, resource_version)
);

-- 4. Approval Steps (Snapshot of steps for a request)
CREATE TABLE public.approval_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    role VARCHAR(100) NOT NULL,
    role_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    approver_snapshot JSONB,
    comment TEXT,
    approved_at TIMESTAMPTZ,
    UNIQUE(request_id, step_order)
);

-- 5. Approval Histories (Append-only)
CREATE TABLE public.approval_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    actor_snapshot JSONB NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_approval_requests_resource ON public.approval_requests(resource_type, resource_id);
CREATE INDEX idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX idx_approval_steps_request ON public.approval_steps(request_id);
CREATE INDEX idx_approval_histories_request ON public.approval_histories(request_id);
