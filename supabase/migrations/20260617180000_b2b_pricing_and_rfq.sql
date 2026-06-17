-- 1. Create fabric_pricing_tiers table
CREATE TABLE IF NOT EXISTS public.fabric_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_catalog_id UUID NOT NULL REFERENCES public.fabric_catalogs(id) ON DELETE CASCADE,
  min_quantity NUMERIC NOT NULL,
  max_quantity NUMERIC, -- NULL means open-ended upper limit (e.g. > 500kg)
  unit_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'VND',
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for fabric_pricing_tiers
CREATE TRIGGER trg_fabric_pricing_tiers_updated_at
  BEFORE UPDATE ON public.fabric_pricing_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS for fabric_pricing_tiers
ALTER TABLE public.fabric_pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY fabric_pricing_tiers_select ON public.fabric_pricing_tiers
  FOR SELECT USING (true);

CREATE POLICY fabric_pricing_tiers_write ON public.fabric_pricing_tiers
  FOR ALL USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

-- 2. Create public_rfq_requests table
CREATE TABLE IF NOT EXISTS public.public_rfq_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_catalog_id UUID NOT NULL REFERENCES public.fabric_catalogs(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.fabric_variants(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT DEFAULT 'kg',
  target_price NUMERIC,
  target_delivery_date DATE,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  company_name TEXT,
  status TEXT CHECK (status IN ('PENDING', 'CONTACTED', 'QUOTED', 'REJECTED')) DEFAULT 'PENDING',
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for public_rfq_requests
CREATE TRIGGER trg_public_rfq_requests_updated_at
  BEFORE UPDATE ON public.public_rfq_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS for public_rfq_requests
ALTER TABLE public.public_rfq_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_rfq_requests_insert ON public.public_rfq_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY public_rfq_requests_select ON public.public_rfq_requests
  FOR SELECT USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY public_rfq_requests_update ON public.public_rfq_requests
  FOR UPDATE USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY public_rfq_requests_delete ON public.public_rfq_requests
  FOR DELETE USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

-- 3. Create rpc_get_fabric_pricing_tiers
CREATE OR REPLACE FUNCTION public.rpc_get_fabric_pricing_tiers(p_fabric_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'min_quantity', min_quantity,
      'max_quantity', max_quantity,
      'unit_price', unit_price,
      'currency', currency
    )
  ) INTO v_result
  FROM (
    SELECT id, min_quantity, max_quantity, unit_price, currency
    FROM public.fabric_pricing_tiers
    WHERE fabric_catalog_id = p_fabric_id
    ORDER BY min_quantity ASC
  ) t;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 4. Create rpc_create_public_rfq_request
CREATE OR REPLACE FUNCTION public.rpc_create_public_rfq_request(
  p_fabric_catalog_id UUID,
  p_variant_id UUID,
  p_quantity NUMERIC,
  p_unit TEXT,
  p_target_price NUMERIC DEFAULT NULL,
  p_target_delivery_date DATE DEFAULT NULL,
  p_contact_name TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL,
  p_contact_email TEXT DEFAULT NULL,
  p_company_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_rfq_id UUID;
BEGIN
  -- Resolve tenant ID
  SELECT tenant_id INTO v_tenant_id
  FROM public.fabric_catalogs
  WHERE id = p_fabric_catalog_id;

  INSERT INTO public.public_rfq_requests (
    fabric_catalog_id,
    variant_id,
    quantity,
    unit,
    target_price,
    target_delivery_date,
    contact_name,
    contact_phone,
    contact_email,
    company_name,
    tenant_id
  ) VALUES (
    p_fabric_catalog_id,
    p_variant_id,
    p_quantity,
    p_unit,
    p_target_price,
    p_target_delivery_date,
    p_contact_name,
    p_contact_phone,
    p_contact_email,
    p_company_name,
    v_tenant_id
  ) RETURNING id INTO v_rfq_id;

  RETURN v_rfq_id;
END;
$$;
