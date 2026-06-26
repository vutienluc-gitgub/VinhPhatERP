-- Update rpc_get_public_fabric_variants to return tiered stock info

DROP FUNCTION IF EXISTS public.rpc_get_public_fabric_variants(UUID);

CREATE OR REPLACE FUNCTION public.rpc_get_public_fabric_variants(p_fabric_id UUID, p_session_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_variants JSONB;
  v_fabric_code TEXT;
BEGIN
  -- Get fabric code for stock lookup
  SELECT code INTO v_fabric_code FROM public.fabric_catalogs WHERE id = p_fabric_id;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', v.id,
      'variant_code', v.variant_code,
      'color_name', v.color_name,
      'color_hex', v.color_hex,
      'color_standard', v.color_standard,
      'color_code', v.color_code,
      'public_image_url', v.public_image_url,
      'is_public', v.is_public,
      'display_order', v.display_order,
      'commercial_override', CASE WHEN vc.id IS NOT NULL THEN
        jsonb_build_object(
          'minimum_stock_order', vc.minimum_stock_order,
          'minimum_custom_order', vc.minimum_custom_order,
          'lead_time_stock', vc.lead_time_stock,
          'lead_time_custom', vc.lead_time_custom,
          'lead_time_unit', vc.lead_time_unit
        )
      ELSE NULL END,
      'stock_status', CASE 
        WHEN COALESCE(s.available_kg, 0) > 0 THEN 'in-stock' 
        ELSE 'out-of-stock' 
      END,
      'available_kg', CASE WHEN auth.uid() IS NOT NULL THEN COALESCE(s.available_kg, 0) ELSE NULL END,
      'roll_count', CASE WHEN auth.uid() IS NOT NULL THEN COALESCE(s.roll_count, 0) ELSE NULL END
    ) ORDER BY v.display_order ASC
  ) INTO v_variants
  FROM public.fabric_variants v
  LEFT JOIN public.fabric_variant_commercials vc ON vc.variant_id = v.id
  LEFT JOIN (
    SELECT color_name, SUM(weight_kg) as available_kg, COUNT(id) as roll_count
    FROM public.finished_fabric_rolls
    WHERE fabric_type = v_fabric_code AND status = 'in_stock' AND reserved_for_order_id IS NULL
    GROUP BY color_name
  ) s ON s.color_name = v.color_name
  WHERE v.fabric_catalog_id = p_fabric_id AND v.is_public = true;

  RETURN COALESCE(v_variants, '[]'::jsonb);
END;
$$;
