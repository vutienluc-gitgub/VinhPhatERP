-- 20260624000000_b2b_batch_rfq.sql

-- 1. Alter crm_rfq_details to support Batch RFQ
ALTER TABLE public.crm_rfq_details 
  ALTER COLUMN fabric_catalog_id DROP NOT NULL,
  ALTER COLUMN quantity DROP NOT NULL;

ALTER TABLE public.crm_rfq_details
  ADD COLUMN IF NOT EXISTS rfq_items JSONB DEFAULT '[]'::jsonb;

-- 2. Alter crm_sample_details to support Batch Sample
ALTER TABLE public.crm_sample_details 
  ALTER COLUMN fabric_catalog_id DROP NOT NULL;

ALTER TABLE public.crm_sample_details
  ADD COLUMN IF NOT EXISTS sample_items JSONB DEFAULT '[]'::jsonb;

-- 3. Rewrite rpc_create_public_rfq_request
CREATE OR REPLACE FUNCTION public.rpc_create_public_rfq_request(
  p_contact_name TEXT,
  p_contact_phone TEXT,
  p_contact_email TEXT DEFAULT NULL,
  p_company_name TEXT DEFAULT NULL,
  p_rfq_items JSONB DEFAULT '[]'::jsonb,
  -- Keep these for backwards compatibility with single item, but they can be null
  p_fabric_catalog_id UUID DEFAULT NULL,
  p_variant_id UUID DEFAULT NULL,
  p_quantity NUMERIC DEFAULT NULL,
  p_unit TEXT DEFAULT 'kg',
  p_target_price NUMERIC DEFAULT NULL,
  p_target_delivery_date DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_lead_id UUID;
BEGIN
  -- We assume all items belong to the same tenant. If p_fabric_catalog_id is null, 
  -- we extract the first catalog_id from p_rfq_items
  IF p_fabric_catalog_id IS NOT NULL THEN
    SELECT tenant_id INTO v_tenant_id
    FROM public.fabric_catalogs
    WHERE id = p_fabric_catalog_id;
  ELSIF jsonb_array_length(p_rfq_items) > 0 THEN
    SELECT tenant_id INTO v_tenant_id
    FROM public.fabric_catalogs
    WHERE id = (p_rfq_items->0->>'fabric_catalog_id')::UUID;
  END IF;

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
    target_delivery_date,
    rfq_items
  ) VALUES (
    v_lead_id,
    p_fabric_catalog_id,
    p_variant_id,
    p_quantity,
    p_unit,
    p_target_price,
    p_target_delivery_date,
    p_rfq_items
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

-- 4. Rewrite rpc_create_public_sample_request
CREATE OR REPLACE FUNCTION public.rpc_create_public_sample_request(
  p_contact_name TEXT,
  p_contact_phone TEXT,
  p_contact_address TEXT,
  p_company_name TEXT DEFAULT NULL,
  p_sample_items JSONB DEFAULT '[]'::jsonb,
  -- Keep for backwards compatibility
  p_fabric_catalog_id UUID DEFAULT NULL,
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
  IF p_fabric_catalog_id IS NOT NULL THEN
    SELECT tenant_id INTO v_tenant_id
    FROM public.fabric_catalogs
    WHERE id = p_fabric_catalog_id;
  ELSIF jsonb_array_length(p_sample_items) > 0 THEN
    SELECT tenant_id INTO v_tenant_id
    FROM public.fabric_catalogs
    WHERE id = (p_sample_items->0->>'fabric_catalog_id')::UUID;
  END IF;

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
    selected_variants,
    sample_items
  ) VALUES (
    v_lead_id,
    p_fabric_catalog_id,
    p_contact_address,
    p_selected_variants,
    p_sample_items
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
