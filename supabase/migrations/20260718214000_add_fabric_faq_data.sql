-- Add faq_data JSONB column to fabric_catalogs
ALTER TABLE public.fabric_catalogs
ADD COLUMN IF NOT EXISTS faq_data JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.fabric_catalogs.faq_data IS 'Dynamic FAQ items per fabric: [{ "question": "...", "answer": "..." }]';

-- Update rpc_get_public_fabric_basic to include faq_data
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
  v_role public.user_role;
  v_can_view_wholesale BOOLEAN := false;
  v_can_view_inventory BOOLEAN := false;
  v_can_order BOOLEAN := false;
  v_can_open_erp BOOLEAN := false;
  v_category RECORD;
BEGIN
  -- Resolve viewer role
  IF auth.uid() IS NOT NULL THEN
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
    v_can_view_wholesale := (v_role IN ('admin', 'manager', 'staff', 'sale', 'customer'));
    v_can_view_inventory := (v_role IN ('admin', 'manager', 'staff', 'sale', 'customer'));
    v_can_order           := (v_role = 'customer');
    v_can_open_erp        := (v_role IN ('admin', 'manager', 'staff', 'sale'));
  END IF;

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

  -- Get category
  SELECT * INTO v_category FROM public.fabric_categories WHERE id = v_fabric.category_id;

  -- Get normalized applications
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'name', a.name,
      'slug', a.slug,
      'icon', a.icon,
      'image', a.image,
      'description', a.description
    ) ORDER BY a.sort_order ASC, a.name ASC
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
    ) ORDER BY c.sort_order ASC, c.name ASC
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
    'technique', v_fabric.technique,
    'view_count', v_fabric.view_count,
    'category_id', v_fabric.category_id,
    'category', CASE WHEN v_category.id IS NOT NULL THEN
      jsonb_build_object(
        'id', v_category.id,
        'code', v_category.code,
        'name', v_category.name,
        'color_hint', v_category.color_hint
      )
    ELSE NULL END,
    'commercial', CASE WHEN v_comm.id IS NOT NULL THEN
      jsonb_build_object(
        'sample_status', v_comm.sample_status,
        'stock_status', v_comm.stock_status,
        'minimum_order_qty', v_comm.minimum_order_qty,
        'minimum_order_unit', v_comm.minimum_order_unit,
        'lead_time_min', v_comm.lead_time_min,
        'lead_time_max', v_comm.lead_time_max,
        'lead_time_unit', v_comm.lead_time_unit,
        'origin_country', v_comm.origin_country,
        -- B2B Planner
        'minimum_order_qty_kg', COALESCE(v_comm.minimum_order_qty_kg, 100),
        'lead_time_days', COALESCE(v_comm.lead_time_days, 7),
        'production_capacity_monthly_tons', COALESCE(v_comm.production_capacity_monthly_tons, 20),
        'yield_factor', COALESCE(v_comm.yield_factor, 1.0),
        -- B2B UI fields
        'public_stock_display', COALESCE(v_comm.public_stock_display, 'status'),
        'trust_has_sample', COALESCE(v_comm.trust_has_sample, false),
        'trust_fast_delivery', COALESCE(v_comm.trust_fast_delivery, false),
        'trust_tech_support', COALESCE(v_comm.trust_tech_support, false),
        'standard_consumption_kg', COALESCE(v_comm.standard_consumption_kg, 0.25)
      )
    ELSE NULL END,
    'applications', COALESCE(v_apps, '[]'::jsonb),
    'characteristics', COALESCE(v_chars, '[]'::jsonb),
    'faq_data', COALESCE(v_fabric.faq_data, '[]'::jsonb),
    -- NEW: Permission block — frontend reads this, never guesses
    'permissions', jsonb_build_object(
      'can_view_wholesale_price', v_can_view_wholesale,
      'can_view_detailed_stock', v_can_view_inventory,
      'can_order', v_can_order,
      'can_rfq', true,
      'can_open_erp', v_can_open_erp,
      'viewer_role', COALESCE(v_role::text, 'anonymous')
    )
  );
END;
$$;
