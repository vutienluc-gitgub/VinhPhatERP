-- Drop old function with TEXT parameter
DROP FUNCTION IF EXISTS public.rpc_get_public_fabric_basic(p_slug TEXT, p_session_id TEXT);

-- Convert session_id column to UUID in fabric_public_views
ALTER TABLE public.fabric_public_views 
  ALTER COLUMN session_id TYPE UUID USING session_id::uuid;

-- Recreate basic RPC with UUID session_id parameter
CREATE OR REPLACE FUNCTION public.rpc_get_public_fabric_basic(p_slug TEXT, p_session_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fabric RECORD;
  v_comm RECORD;
  v_apps JSONB;
  v_chars JSONB;
BEGIN
  -- Update view count on basic fetch
  UPDATE public.fabric_catalogs
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE slug = p_slug AND is_public = true
  RETURNING * INTO v_fabric;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Insert view metrics if session_id is provided
  IF p_session_id IS NOT NULL THEN
    INSERT INTO public.fabric_public_views (fabric_catalog_id, session_id)
    VALUES (v_fabric.id, p_session_id);
  END IF;

  -- Get commercial details
  SELECT * INTO v_comm FROM public.fabric_commercials WHERE fabric_catalog_id = v_fabric.id;

  -- Get normalized applications
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'name', a.name,
      'slug', a.slug,
      'icon', a.icon,
      'image', a.image,
      'description', a.description
    )
  ) INTO v_apps
  FROM public.applications a
  JOIN public.fabric_application_map fam ON fam.application_id = a.id
  WHERE fam.fabric_catalog_id = v_fabric.id;

  -- Get normalized characteristics
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'icon', c.icon,
      'description', c.description
    )
  ) INTO v_chars
  FROM public.characteristics c
  JOIN public.fabric_characteristic_map fcm ON fcm.characteristic_id = c.id
  WHERE fcm.fabric_catalog_id = v_fabric.id;

  RETURN jsonb_build_object(
    'id', v_fabric.id,
    'code', v_fabric.code,
    'slug', v_fabric.slug,
    'name', v_fabric.name,
    'composition', v_fabric.composition,
    'composition_tags', v_fabric.composition_tags,
    'target_width_cm', v_fabric.target_width_cm,
    'target_gsm', v_fabric.target_gsm,
    'unit', v_fabric.unit,
    'image_url', v_fabric.image_url,
    'fabric_type', v_fabric.fabric_type,
    'weave_pattern', v_fabric.weave_pattern,
    'stretch_type', v_fabric.stretch_type,
    'thickness', v_fabric.thickness,
    'view_count', v_fabric.view_count,
    'commercial', CASE WHEN v_comm.id IS NOT NULL THEN
      jsonb_build_object(
        'sample_status', v_comm.sample_status,
        'stock_status', v_comm.stock_status,
        'minimum_order_qty', v_comm.minimum_order_qty,
        'minimum_order_unit', v_comm.minimum_order_unit,
        'lead_time_min', v_comm.lead_time_min,
        'lead_time_max', v_comm.lead_time_max,
        'lead_time_unit', v_comm.lead_time_unit,
        'origin_country', v_comm.origin_country
      )
    ELSE NULL END,
    'applications', COALESCE(v_apps, '[]'::jsonb),
    'characteristics', COALESCE(v_chars, '[]'::jsonb)
  );
END;
$$;
