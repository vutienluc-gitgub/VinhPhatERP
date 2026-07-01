-- Migration: B2B Pricing & Stock — Role-based access control
-- Replaces auth.uid() IS NOT NULL checks with proper role-based permission logic.
-- Returns a 'permissions' block from rpc_get_public_fabric_basic so frontend
-- never has to guess access rights.

--------------------------------------------------------------------------------
-- 1. rpc_get_public_fabric_basic — add permissions block
--------------------------------------------------------------------------------
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

--------------------------------------------------------------------------------
-- 2. rpc_get_public_fabric_variants — role-based stock visibility
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_get_public_fabric_variants(p_fabric_id UUID, p_session_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_variants JSONB;
  v_fabric_code TEXT;
  v_stock_display public_stock_display_type;
  v_role public.user_role;
  v_can_view_stock BOOLEAN := false;
BEGIN
  -- Resolve viewer role
  IF auth.uid() IS NOT NULL THEN
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
    v_can_view_stock := (v_role IN ('admin', 'manager', 'staff', 'sale', 'customer'));
  END IF;

  -- Get fabric code for stock lookup
  SELECT code INTO v_fabric_code FROM public.fabric_catalogs WHERE id = p_fabric_id;

  -- Get stock display setting
  SELECT public_stock_display INTO v_stock_display FROM public.fabric_commercials WHERE fabric_catalog_id = p_fabric_id;
  IF v_stock_display IS NULL THEN
    v_stock_display := 'status';
  END IF;

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
        WHEN v_stock_display = 'none' AND NOT v_can_view_stock THEN NULL
        WHEN COALESCE(s.available_kg, 0) > 0 THEN 'in-stock'
        ELSE 'out-of-stock'
      END,
      'available_kg', CASE
        WHEN v_can_view_stock OR v_stock_display = 'quantity' THEN COALESCE(s.available_kg, 0)
        ELSE NULL
      END,
      'roll_count', CASE
        WHEN v_can_view_stock OR v_stock_display = 'quantity' THEN COALESCE(s.roll_count, 0)
        ELSE NULL
      END
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

--------------------------------------------------------------------------------
-- 3. rpc_get_fabric_pricing_tiers — role-based tier visibility
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_get_fabric_pricing_tiers(p_fabric_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_role public.user_role;
  v_show_all BOOLEAN := false;
BEGIN
  -- Resolve viewer role
  IF auth.uid() IS NOT NULL THEN
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
    v_show_all := (v_role IN ('admin', 'manager', 'staff', 'sale', 'customer'));
  END IF;

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
      AND (v_show_all OR is_public_visible = true)
    ORDER BY min_quantity ASC
  ) t;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
