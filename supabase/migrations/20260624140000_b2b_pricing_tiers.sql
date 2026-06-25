-- 1. Alter fabric_pricing_tiers to add B2B labels and visibility flag
ALTER TABLE public.fabric_pricing_tiers
ADD COLUMN IF NOT EXISTS display_label TEXT,
ADD COLUMN IF NOT EXISTS is_public_visible BOOLEAN DEFAULT TRUE;

-- 2. Update rpc_get_fabric_pricing_tiers to return new columns and filter by visibility
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
      'currency', currency,
      'display_label', display_label,
      'is_public_visible', is_public_visible
    )
  ) INTO v_result
  FROM (
    SELECT id, min_quantity, max_quantity, unit_price, currency, display_label, is_public_visible
    FROM public.fabric_pricing_tiers
    WHERE fabric_catalog_id = p_fabric_id
    ORDER BY min_quantity ASC
  ) t;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 3. Create rpc_update_fabric_pricing_tiers for bulk sync from ERP Admin
CREATE OR REPLACE FUNCTION public.rpc_update_fabric_pricing_tiers(
  p_fabric_id UUID,
  p_tiers JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_tier JSONB;
BEGIN
  -- Validate permission
  SELECT tenant_id INTO v_tenant_id FROM public.fabric_catalogs WHERE id = p_fabric_id;
  
  -- Clear existing tiers for this fabric
  DELETE FROM public.fabric_pricing_tiers WHERE fabric_catalog_id = p_fabric_id;

  -- Insert new tiers if array is provided
  IF p_tiers IS NOT NULL AND jsonb_array_length(p_tiers) > 0 THEN
    FOR v_tier IN SELECT * FROM jsonb_array_elements(p_tiers)
    LOOP
      INSERT INTO public.fabric_pricing_tiers (
        fabric_catalog_id,
        min_quantity,
        max_quantity,
        unit_price,
        currency,
        display_label,
        is_public_visible,
        tenant_id
      ) VALUES (
        p_fabric_id,
        (v_tier->>'min_quantity')::NUMERIC,
        NULLIF((v_tier->>'max_quantity'), '')::NUMERIC,
        (v_tier->>'unit_price')::NUMERIC,
        COALESCE(v_tier->>'currency', 'VND'),
        NULLIF((v_tier->>'display_label'), ''),
        COALESCE((v_tier->>'is_public_visible')::BOOLEAN, TRUE),
        v_tenant_id
      );
    END LOOP;
  END IF;
END;
$$;
