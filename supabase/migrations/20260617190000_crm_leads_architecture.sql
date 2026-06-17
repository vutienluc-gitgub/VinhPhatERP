-- Drop old tables if they exist (safe to do since it's just created and no production data)
DROP TABLE IF EXISTS public.public_rfq_requests CASCADE;
DROP TABLE IF EXISTS public.public_sample_requests CASCADE;

-- 1. Create crm_leads table
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('RFQ', 'SAMPLE', 'CONTACT')),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('NEW', 'CONTACTED', 'SAMPLE_SENT', 'QUOTED', 'NEGOTIATING', 'WON', 'LOST')) DEFAULT 'NEW',
  score INTEGER DEFAULT 0,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_leads_select ON public.crm_leads
  FOR SELECT USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );
  
CREATE POLICY crm_leads_insert ON public.crm_leads
  FOR INSERT WITH CHECK (true); -- Public insert allowed for leads

CREATE POLICY crm_leads_update ON public.crm_leads
  FOR UPDATE USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

-- 2. Create crm_rfq_details table
CREATE TABLE IF NOT EXISTS public.crm_rfq_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  fabric_catalog_id UUID NOT NULL REFERENCES public.fabric_catalogs(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.fabric_variants(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT DEFAULT 'kg',
  target_price NUMERIC,
  target_delivery_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT crm_rfq_details_lead_id_key UNIQUE (lead_id)
);

CREATE TRIGGER trg_crm_rfq_details_updated_at
  BEFORE UPDATE ON public.crm_rfq_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.crm_rfq_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_rfq_details_select ON public.crm_rfq_details FOR SELECT USING (true);
CREATE POLICY crm_rfq_details_insert ON public.crm_rfq_details FOR INSERT WITH CHECK (true);
CREATE POLICY crm_rfq_details_update ON public.crm_rfq_details FOR UPDATE USING (true);


-- 3. Create crm_sample_details table
CREATE TABLE IF NOT EXISTS public.crm_sample_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  fabric_catalog_id UUID NOT NULL REFERENCES public.fabric_catalogs(id) ON DELETE CASCADE,
  delivery_address TEXT NOT NULL,
  selected_variants JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT crm_sample_details_lead_id_key UNIQUE (lead_id)
);

CREATE TRIGGER trg_crm_sample_details_updated_at
  BEFORE UPDATE ON public.crm_sample_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.crm_sample_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_sample_details_select ON public.crm_sample_details FOR SELECT USING (true);
CREATE POLICY crm_sample_details_insert ON public.crm_sample_details FOR INSERT WITH CHECK (true);
CREATE POLICY crm_sample_details_update ON public.crm_sample_details FOR UPDATE USING (true);


-- 4. Create crm_activities table
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('CALL', 'NOTE', 'EMAIL', 'SAMPLE', 'QUOTE', 'ORDER', 'SYSTEM')),
  description TEXT NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_crm_activities_updated_at
  BEFORE UPDATE ON public.crm_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_activities_select ON public.crm_activities
  FOR SELECT USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );
  
CREATE POLICY crm_activities_insert ON public.crm_activities
  FOR INSERT WITH CHECK (true); -- Allow system insertion
  
CREATE POLICY crm_activities_update ON public.crm_activities
  FOR UPDATE USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

-- 5. Rewrite rpc_create_public_rfq_request
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
  v_lead_id UUID;
BEGIN
  -- Resolve tenant ID
  SELECT tenant_id INTO v_tenant_id
  FROM public.fabric_catalogs
  WHERE id = p_fabric_catalog_id;

  -- Insert Lead
  INSERT INTO public.crm_leads (
    type,
    customer_name,
    phone,
    email,
    company_name,
    status,
    tenant_id
  ) VALUES (
    'RFQ',
    p_contact_name,
    p_contact_phone,
    p_contact_email,
    p_company_name,
    'NEW',
    v_tenant_id
  ) RETURNING id INTO v_lead_id;

  -- Insert RFQ Detail
  INSERT INTO public.crm_rfq_details (
    lead_id,
    fabric_catalog_id,
    variant_id,
    quantity,
    unit,
    target_price,
    target_delivery_date
  ) VALUES (
    v_lead_id,
    p_fabric_catalog_id,
    p_variant_id,
    p_quantity,
    p_unit,
    p_target_price,
    p_target_delivery_date
  );

  -- Insert Activity
  INSERT INTO public.crm_activities (
    lead_id,
    type,
    description,
    tenant_id
  ) VALUES (
    v_lead_id,
    'SYSTEM',
    'Khách hàng tạo Yêu cầu Báo giá (RFQ) từ trang web',
    v_tenant_id
  );

  RETURN v_lead_id;
END;
$$;


-- 6. Rewrite rpc_create_public_sample_request
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
  v_lead_id UUID;
BEGIN
  -- Lấy tenant_id từ sản phẩm
  SELECT tenant_id INTO v_tenant_id
  FROM public.fabric_catalogs
  WHERE id = p_fabric_catalog_id;

  -- Insert Lead
  INSERT INTO public.crm_leads (
    type,
    customer_name,
    phone,
    email,
    company_name,
    status,
    tenant_id
  ) VALUES (
    'SAMPLE',
    p_contact_name,
    p_contact_phone,
    NULL,
    p_company_name,
    'NEW',
    v_tenant_id
  ) RETURNING id INTO v_lead_id;

  -- Insert Sample Detail
  INSERT INTO public.crm_sample_details (
    lead_id,
    fabric_catalog_id,
    delivery_address,
    selected_variants
  ) VALUES (
    v_lead_id,
    p_fabric_catalog_id,
    p_contact_address,
    p_selected_variants
  );

  -- Insert Activity
  INSERT INTO public.crm_activities (
    lead_id,
    type,
    description,
    tenant_id
  ) VALUES (
    v_lead_id,
    'SYSTEM',
    'Khách hàng tạo Yêu cầu Mẫu từ trang web',
    v_tenant_id
  );

  RETURN v_lead_id;
END;
$$;
