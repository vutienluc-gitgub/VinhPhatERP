-- 1. Create company_roles table
CREATE TABLE IF NOT EXISTS public.company_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL DEFAULT (current_setting('app.tenant_id', true))::uuid,
    code text NOT NULL,
    name text NOT NULL,
    is_system boolean DEFAULT false,
    system_role_ref text, -- Reference to the base user_role enum if needed for RLS
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tenant_id, code)
);

-- Indices
CREATE INDEX IF NOT EXISTS company_roles_tenant_id_idx ON public.company_roles(tenant_id);

-- Enable RLS
ALTER TABLE public.company_roles ENABLE ROW LEVEL SECURITY;

-- Setup policies
CREATE POLICY "Enable full access for authenticated users in tenant" ON public.company_roles
    FOR ALL USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);

-- 2. Drop the hardcoded constraint on employees table
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_role_check;

-- 3. Seed default system roles into company_roles for all existing tenants
DO $$
DECLARE
    t_id uuid;
BEGIN
    FOR t_id IN SELECT DISTINCT id FROM public.tenants LOOP
        INSERT INTO public.company_roles (tenant_id, code, name, is_system, system_role_ref)
        VALUES 
            (t_id, 'admin', 'Quản trị viên', true, 'admin'),
            (t_id, 'sales', 'Kinh doanh', true, 'sale'),
            (t_id, 'warehouse', 'Kho bãi', true, 'warehouse'),
            (t_id, 'driver', 'Tài xế', true, 'driver')
        ON CONFLICT (tenant_id, code) DO NOTHING;
    END LOOP;
END
$$;
