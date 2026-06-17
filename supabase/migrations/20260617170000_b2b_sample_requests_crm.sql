-- 1. Create public_sample_requests table
CREATE TABLE IF NOT EXISTS public.public_sample_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_catalog_id UUID NOT NULL REFERENCES public.fabric_catalogs(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_address TEXT NOT NULL,
  company_name TEXT,
  selected_variants JSONB DEFAULT '[]'::jsonb,
  status TEXT CHECK (status IN ('PENDING', 'APPROVED', 'DISPATCHED', 'REJECTED')) DEFAULT 'PENDING',
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for public_sample_requests
CREATE TRIGGER trg_public_sample_requests_updated_at
  BEFORE UPDATE ON public.public_sample_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS policies
ALTER TABLE public.public_sample_requests ENABLE ROW LEVEL SECURITY;

-- Allowed for anyone to insert (public sample requests)
CREATE POLICY public_sample_requests_insert ON public.public_sample_requests
  FOR INSERT WITH CHECK (true);

-- Authenticated tenant-isolation select
CREATE POLICY public_sample_requests_tenant_select ON public.public_sample_requests
  FOR SELECT USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

-- Authenticated tenant-isolation update
CREATE POLICY public_sample_requests_tenant_update ON public.public_sample_requests
  FOR UPDATE USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

-- Authenticated tenant-isolation delete
CREATE POLICY public_sample_requests_tenant_delete ON public.public_sample_requests
  FOR DELETE USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

-- 2. Create RPC for sample request lead capture
CREATE OR REPLACE FUNCTION public.rpc_create_public_sample_request(
  p_fabric_catalog_id UUID,
  p_contact_name TEXT,
  p_contact_phone TEXT,
  p_contact_address TEXT,
  p_company_name TEXT DEFAULT NULL,
  p_selected_variants JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_request_id UUID;
BEGIN
  -- Resolve tenant_id of parent fabric catalog
  SELECT tenant_id INTO v_tenant_id
  FROM public.fabric_catalogs
  WHERE id = p_fabric_catalog_id;

  INSERT INTO public.public_sample_requests (
    fabric_catalog_id,
    contact_name,
    contact_phone,
    contact_address,
    company_name,
    selected_variants,
    tenant_id
  ) VALUES (
    p_fabric_catalog_id,
    p_contact_name,
    p_contact_phone,
    p_contact_address,
    p_company_name,
    p_selected_variants,
    v_tenant_id
  ) RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;
