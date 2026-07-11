-- Drop old signatures to avoid overloads in PostgreSQL
DROP FUNCTION IF EXISTS public.rpc_create_public_rfq_request(text, text, text, text, jsonb, uuid, uuid, numeric, text, numeric, date);
DROP FUNCTION IF EXISTS public.rpc_create_public_rfq_request(text, text, text, text, jsonb, uuid, uuid, numeric, text, numeric, date, text, text, text);

-- Recreate with correct signature
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
  v_score INTEGER := 0;
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

  -- 1. Calculate Score
  IF p_rfq_type = 'oem' THEN
    v_score := v_score + 3;
  ELSIF p_rfq_type = 'bulk_quote' THEN
    v_score := v_score + 2;
  END IF;

  IF p_company_name IS NOT NULL AND trim(p_company_name) <> '' THEN
    v_score := v_score + 1;
  END IF;

  IF p_quantity IS NOT NULL THEN
    IF p_quantity >= 5000 THEN
      v_score := v_score + 2;
    ELSIF p_quantity >= 1000 THEN
      v_score := v_score + 1;
    END IF;
  END IF;

  -- 2. Insert Lead with channel, source tracking and score
  INSERT INTO public.crm_leads (
    type,
    customer_name,
    phone,
    email,
    company_name,
    status,
    lead_channel,
    lead_source,
    score,
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
    v_score,
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
    'Khách hàng tạo Yêu cầu Báo giá (RFQ) từ trang web [' || p_lead_source || '] - Tự động chấm ' || v_score || ' điểm',
    v_tenant_id
  );

  RETURN v_lead_id;
END;
$$;
