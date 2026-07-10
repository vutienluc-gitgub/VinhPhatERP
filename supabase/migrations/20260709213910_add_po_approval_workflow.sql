-- 1. Modify Enum purchase_order_status
ALTER TYPE purchase_order_status ADD VALUE IF NOT EXISTS 'submitted';
ALTER TYPE purchase_order_status ADD VALUE IF NOT EXISTS 'pending_approval';
ALTER TYPE purchase_order_status ADD VALUE IF NOT EXISTS 'request_changes';
ALTER TYPE purchase_order_status ADD VALUE IF NOT EXISTS 'sent';
ALTER TYPE purchase_order_status ADD VALUE IF NOT EXISTS 'supplier_confirmed';
ALTER TYPE purchase_order_status ADD VALUE IF NOT EXISTS 'receiving';

-- 2. Create approval_policies table
CREATE TABLE IF NOT EXISTS public.approval_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role public.user_role NOT NULL,
    max_amount NUMERIC, -- NULL means unlimited
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, role)
);

-- Enable RLS
ALTER TABLE public.approval_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their tenant's approval_policies"
ON public.approval_policies FOR SELECT
TO authenticated
USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage their tenant's approval_policies"
ON public.approval_policies FOR ALL
TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    AND public.current_user_role() = 'admin'
);

-- 3. Insert default policies for existing tenants
DO $$
DECLARE
    t_id UUID;
BEGIN
    FOR t_id IN SELECT id FROM public.tenants LOOP
        IF NOT EXISTS (SELECT 1 FROM public.approval_policies WHERE tenant_id = t_id) THEN
            INSERT INTO public.approval_policies (tenant_id, role, max_amount) VALUES
            (t_id, 'admin', NULL),
            (t_id, 'manager', 50000000),
            (t_id, 'staff', 0);
        END IF;
    END LOOP;
END
$$;

-- 4. Add comment to po_audit_logs if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='po_audit_logs' AND column_name='comment'
    ) THEN
        ALTER TABLE public.po_audit_logs ADD COLUMN comment TEXT;
    END IF;
END
$$;
