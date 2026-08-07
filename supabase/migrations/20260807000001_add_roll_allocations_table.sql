-- ========================================================================================
-- 1. Create roll_allocations table
-- ========================================================================================
CREATE TABLE IF NOT EXISTS public.roll_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    roll_id UUID NOT NULL REFERENCES public.raw_fabric_rolls(id) ON DELETE RESTRICT,
    target_type TEXT NOT NULL, -- e.g., 'dyeing_order', 'weaving_invoice', 'inspection'
    target_id UUID NOT NULL,
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    allocated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Ensuring a roll can only be allocated once at a time across all active targets
    CONSTRAINT uq_roll_allocation UNIQUE (roll_id)
);

-- RLS for roll_allocations
ALTER TABLE public.roll_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for tenant users" ON public.roll_allocations
    FOR SELECT USING (
        tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid
    );

CREATE POLICY "Enable all for tenant users" ON public.roll_allocations
    FOR ALL USING (
        tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_roll_allocations_tenant_id ON public.roll_allocations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roll_allocations_roll_id ON public.roll_allocations(roll_id);
CREATE INDEX IF NOT EXISTS idx_roll_allocations_target ON public.roll_allocations(target_type, target_id);
