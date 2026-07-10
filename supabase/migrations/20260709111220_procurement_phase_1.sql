-- 1. Purchase Requests (PR)
CREATE TABLE IF NOT EXISTS public.purchase_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    pr_no VARCHAR(50) NOT NULL,
    requester_dept VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high, urgent
    status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, approved, rejected, sourcing, fulfilled
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (tenant_id, pr_no)
);

CREATE TABLE IF NOT EXISTS public.purchase_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    pr_id UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
    material_id UUID, -- Optional link to master materials if it exists
    material_name VARCHAR(255) NOT NULL,
    material_specs TEXT,
    qty_required DECIMAL(15, 2) NOT NULL,
    uom VARCHAR(50) NOT NULL,
    expected_date DATE,
    purpose TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Sourcing RFQs
CREATE TABLE IF NOT EXISTS public.sourcing_rfqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    rfq_code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    deadline_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'open', -- open, closing_soon, closed, awarded
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (tenant_id, rfq_code)
);

CREATE TABLE IF NOT EXISTS public.sourcing_rfq_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    rfq_id UUID NOT NULL REFERENCES public.sourcing_rfqs(id) ON DELETE CASCADE,
    pr_item_id UUID REFERENCES public.purchase_request_items(id) ON DELETE SET NULL, -- Link back to PR
    material_id UUID,
    material_name VARCHAR(255) NOT NULL,
    material_specs TEXT,
    qty_required DECIMAL(15, 2) NOT NULL,
    uom VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)

-- Purchase Requests
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for purchase_requests" ON public.purchase_requests
    FOR ALL USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);

ALTER TABLE public.purchase_request_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for purchase_request_items" ON public.purchase_request_items
    FOR ALL USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);

-- Sourcing RFQs
ALTER TABLE public.sourcing_rfqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for sourcing_rfqs" ON public.sourcing_rfqs
    FOR ALL USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);

ALTER TABLE public.sourcing_rfq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for sourcing_rfq_items" ON public.sourcing_rfq_items
    FOR ALL USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pr_tenant ON public.purchase_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pr_status ON public.purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_rfq_tenant ON public.sourcing_rfqs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rfq_status ON public.sourcing_rfqs(status);
