-- Migration: Add lead_channel & lead_source to crm_leads
-- and update RPCs to accept and store these fields.

-- 1. Add columns to crm_leads
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS lead_channel TEXT DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS lead_source  TEXT DEFAULT 'unknown';

COMMENT ON COLUMN public.crm_leads.lead_channel
  IS 'Kênh tiếp cận: website | portal | qr | sales | campaign | api';
COMMENT ON COLUMN public.crm_leads.lead_source
  IS 'Nguồn cụ thể trong kênh: sticky_cta | planner | wishlist | product_card | hero_banner | search';

-- 2. Add rfq_type to crm_rfq_details
ALTER TABLE public.crm_rfq_details
  ADD COLUMN IF NOT EXISTS rfq_type TEXT DEFAULT 'quote';

COMMENT ON COLUMN public.crm_rfq_details.rfq_type
  IS 'Loại nhu cầu: quote | bulk_quote | oem | processing';

-- 3. Rewrite rpc_create_public_rfq_request with lead tracking
CREATE OR REPLACE FUNCTION public.rpc_create_public_rfq_request(
  p_contact_name TEXT,
  p_contact_phone TEXT,
  p_contact_email TEXT DEFAULT NULL,
  p_company_name TEXT DEFAULT NULL,
  p_rfq_items JSONB DEFAULT '[]'::jsonb,
  p_fabric_catalog_id UUID DEFAULT NULL,
  p_variant_id UUID DEFAULT NULL,
  p_quantity NUMERIC DEFAULT NULL,
  p_unit TEXT DEFAULT 'kg',
  p_target_price NUMERIC DEFAULT NULL,
  p_target_delivery_date DATE DEFAULT NULL,
  p_lead_channel TEXT DEFAULT 'website',
  p_lead_source TEXT DEFAULT 'unknown',
  p_rfq_type TEXT DEFAULT 'quote'
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
  ELSIF jsonb_array_length(p_rfq_items) > 0 THEN
    SELECT tenant_id INTO v_tenant_id
    FROM public.fabric_catalogs
    WHERE id = (p_rfq_items->0->>'fabric_catalog_id')::UUID;
  END IF;

  -- Insert Lead with channel & source tracking
  INSERT INTO public.crm_leads (
    type,
    customer_name,
    phone,
    email,
    company_name,
    status,
    lead_channel,
    lead_source,
    tenant_id
  ) VALUES (
    'RFQ',
    p_contact_name,
    p_contact_phone,
    p_contact_email,
    p_company_name,
    'NEW',
    p_lead_channel,
    p_lead_source,
    v_tenant_id
  ) RETURNING id INTO v_lead_id;

  -- Insert RFQ Detail with rfq_type
  INSERT INTO public.crm_rfq_details (
    lead_id,
    fabric_catalog_id,
    variant_id,
    quantity,
    unit,
    target_price,
    target_delivery_date,
    rfq_items,
    rfq_type
  ) VALUES (
    v_lead_id,
    p_fabric_catalog_id,
    p_variant_id,
    p_quantity,
    p_unit,
    p_target_price,
    p_target_delivery_date,
    p_rfq_items,
    p_rfq_type
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
    'Khách hàng tạo Yêu cầu Báo giá (RFQ) từ trang web [' || p_lead_source || ']',
    v_tenant_id
  );

  RETURN v_lead_id;
END;
$$;

-- 4. Rewrite rpc_create_public_sample_request with lead tracking
CREATE OR REPLACE FUNCTION public.rpc_create_public_sample_request(
  p_contact_name TEXT,
  p_contact_phone TEXT,
  p_contact_address TEXT,
  p_company_name TEXT DEFAULT NULL,
  p_sample_items JSONB DEFAULT '[]'::jsonb,
  p_fabric_catalog_id UUID DEFAULT NULL,
  p_selected_variants JSONB DEFAULT '[]'::jsonb,
  p_lead_channel TEXT DEFAULT 'website',
  p_lead_source TEXT DEFAULT 'unknown'
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

  -- Insert Lead with channel & source tracking
  INSERT INTO public.crm_leads (
    type,
    customer_name,
    phone,
    email,
    company_name,
    status,
    lead_channel,
    lead_source,
    tenant_id
  ) VALUES (
    'SAMPLE',
    p_contact_name,
    p_contact_phone,
    NULL,
    p_company_name,
    'NEW',
    p_lead_channel,
    p_lead_source,
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
    'Khách hàng tạo Yêu cầu Mẫu từ trang web [' || p_lead_source || ']',
    v_tenant_id
  );

  RETURN v_lead_id;
END;
$$;
