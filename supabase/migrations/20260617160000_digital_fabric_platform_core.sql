-- 1. Create table public.fabric_commercials
CREATE TABLE IF NOT EXISTS public.fabric_commercials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_catalog_id UUID NOT NULL UNIQUE REFERENCES public.fabric_catalogs(id) ON DELETE CASCADE,
  sample_status TEXT CHECK (sample_status IN ('AVAILABLE', 'OUT_OF_STOCK', 'PREPARING')) DEFAULT 'AVAILABLE',
  stock_status TEXT CHECK (stock_status IN ('READY', 'CUSTOM', 'OUT_OF_STOCK', 'COMING_SOON')) DEFAULT 'READY',
  minimum_order_qty NUMERIC,
  minimum_order_unit TEXT,
  lead_time_min INTEGER,
  lead_time_max INTEGER,
  lead_time_unit TEXT DEFAULT 'day',
  origin_country TEXT DEFAULT 'Việt Nam',
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for fabric_commercials
CREATE TRIGGER trg_fabric_commercials_updated_at
  BEFORE UPDATE ON public.fabric_commercials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS for fabric_commercials
ALTER TABLE public.fabric_commercials ENABLE ROW LEVEL SECURITY;

CREATE POLICY fabric_commercials_select ON public.fabric_commercials FOR SELECT USING (true);
CREATE POLICY fabric_commercials_insert ON public.fabric_commercials FOR INSERT WITH CHECK (true);
CREATE POLICY fabric_commercials_update ON public.fabric_commercials FOR UPDATE USING (true);
CREATE POLICY fabric_commercials_delete ON public.fabric_commercials FOR DELETE USING (true);

-- 2. Alter public.fabric_variants to add Pantone and standard code properties
ALTER TABLE public.fabric_variants 
  ADD COLUMN IF NOT EXISTS color_standard TEXT CHECK (color_standard IN ('PANTONE', 'LAB', 'CUSTOM')) DEFAULT 'PANTONE',
  ADD COLUMN IF NOT EXISTS color_code TEXT;

-- 3. Create table public.fabric_variant_commercials
CREATE TABLE IF NOT EXISTS public.fabric_variant_commercials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL UNIQUE REFERENCES public.fabric_variants(id) ON DELETE CASCADE,
  minimum_stock_order NUMERIC,
  minimum_custom_order NUMERIC,
  lead_time_stock INTEGER,
  lead_time_custom INTEGER,
  lead_time_unit TEXT DEFAULT 'day',
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for fabric_variant_commercials
CREATE TRIGGER trg_fabric_variant_commercials_updated_at
  BEFORE UPDATE ON public.fabric_variant_commercials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS for fabric_variant_commercials
ALTER TABLE public.fabric_variant_commercials ENABLE ROW LEVEL SECURITY;

CREATE POLICY fabric_variant_commercials_select ON public.fabric_variant_commercials FOR SELECT USING (true);
CREATE POLICY fabric_variant_commercials_insert ON public.fabric_variant_commercials FOR INSERT WITH CHECK (true);
CREATE POLICY fabric_variant_commercials_update ON public.fabric_variant_commercials FOR UPDATE USING (true);
CREATE POLICY fabric_variant_commercials_delete ON public.fabric_variant_commercials FOR DELETE USING (true);

-- 4. Create public.applications and public.fabric_application_map
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  image TEXT,
  description TEXT,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY applications_select ON public.applications FOR SELECT USING (true);
CREATE POLICY applications_insert ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY applications_update ON public.applications FOR UPDATE USING (true);
CREATE POLICY applications_delete ON public.applications FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS public.fabric_application_map (
  fabric_catalog_id UUID NOT NULL REFERENCES public.fabric_catalogs(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  PRIMARY KEY (fabric_catalog_id, application_id)
);

ALTER TABLE public.fabric_application_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY fabric_application_map_select ON public.fabric_application_map FOR SELECT USING (true);
CREATE POLICY fabric_application_map_insert ON public.fabric_application_map FOR INSERT WITH CHECK (true);
CREATE POLICY fabric_application_map_update ON public.fabric_application_map FOR UPDATE USING (true);
CREATE POLICY fabric_application_map_delete ON public.fabric_application_map FOR DELETE USING (true);

-- 5. Create public.characteristics and public.fabric_characteristic_map
CREATE TABLE IF NOT EXISTS public.characteristics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_characteristics_updated_at
  BEFORE UPDATE ON public.characteristics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.characteristics ENABLE ROW LEVEL SECURITY;
CREATE POLICY characteristics_select ON public.characteristics FOR SELECT USING (true);
CREATE POLICY characteristics_insert ON public.characteristics FOR INSERT WITH CHECK (true);
CREATE POLICY characteristics_update ON public.characteristics FOR UPDATE USING (true);
CREATE POLICY characteristics_delete ON public.characteristics FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS public.fabric_characteristic_map (
  fabric_catalog_id UUID NOT NULL REFERENCES public.fabric_catalogs(id) ON DELETE CASCADE,
  characteristic_id UUID NOT NULL REFERENCES public.characteristics(id) ON DELETE CASCADE,
  PRIMARY KEY (fabric_catalog_id, characteristic_id)
);

ALTER TABLE public.fabric_characteristic_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY fabric_characteristic_map_select ON public.fabric_characteristic_map FOR SELECT USING (true);
CREATE POLICY fabric_characteristic_map_insert ON public.fabric_characteristic_map FOR INSERT WITH CHECK (true);
CREATE POLICY fabric_characteristic_map_update ON public.fabric_characteristic_map FOR UPDATE USING (true);
CREATE POLICY fabric_characteristic_map_delete ON public.fabric_characteristic_map FOR DELETE USING (true);

-- 6. Create public.fabric_images
CREATE TABLE IF NOT EXISTS public.fabric_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_catalog_id UUID NOT NULL REFERENCES public.fabric_catalogs(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.fabric_variants(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('SWATCH', 'SURFACE', 'BACK', 'STRETCH', 'APPLICATION')),
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_fabric_images_updated_at
  BEFORE UPDATE ON public.fabric_images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.fabric_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY fabric_images_select ON public.fabric_images FOR SELECT USING (true);
CREATE POLICY fabric_images_insert ON public.fabric_images FOR INSERT WITH CHECK (true);
CREATE POLICY fabric_images_update ON public.fabric_images FOR UPDATE USING (true);
CREATE POLICY fabric_images_delete ON public.fabric_images FOR DELETE USING (true);

-- 7. Create public.fabric_public_views
CREATE TABLE IF NOT EXISTS public.fabric_public_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_catalog_id UUID NOT NULL REFERENCES public.fabric_catalogs(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  device_type TEXT,
  country TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.fabric_public_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY fabric_public_views_select ON public.fabric_public_views FOR SELECT USING (true);
CREATE POLICY fabric_public_views_insert ON public.fabric_public_views FOR INSERT WITH CHECK (true);
CREATE POLICY fabric_public_views_update ON public.fabric_public_views FOR UPDATE USING (true);
CREATE POLICY fabric_public_views_delete ON public.fabric_public_views FOR DELETE USING (true);

-- 8. Backfill fabric_commercials from existing catalogs data
INSERT INTO public.fabric_commercials (
  fabric_catalog_id,
  sample_status,
  stock_status,
  minimum_order_qty,
  minimum_order_unit,
  lead_time_min,
  lead_time_max,
  lead_time_unit,
  origin_country,
  tenant_id
)
SELECT 
  id,
  CASE WHEN stock_status = 'SAMPLE_AVAILABLE' THEN 'AVAILABLE'::text ELSE 'OUT_OF_STOCK'::text END,
  CASE WHEN stock_status = 'READY_STOCK' THEN 'READY'::text 
       WHEN stock_status = 'CUSTOM_ORDER' THEN 'CUSTOM'::text 
       ELSE 'OUT_OF_STOCK'::text END,
  minimum_order_qty,
  minimum_order_unit,
  lead_time_min,
  lead_time_max,
  lead_time_unit,
  'Việt Nam',
  tenant_id
FROM public.fabric_catalogs
ON CONFLICT (fabric_catalog_id) DO NOTHING;

-- 9. Create segregated RPC functions (BFF)

-- 9a. Basic RPC
CREATE OR REPLACE FUNCTION public.rpc_get_public_fabric_basic(p_slug TEXT, p_session_id TEXT DEFAULT NULL)
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

-- 9b. Variants RPC
CREATE OR REPLACE FUNCTION public.rpc_get_public_fabric_variants(p_fabric_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_variants JSONB;
BEGIN
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
      ELSE NULL END
    ) ORDER BY v.display_order ASC
  ) INTO v_variants
  FROM public.fabric_variants v
  LEFT JOIN public.fabric_variant_commercials vc ON vc.variant_id = v.id
  WHERE v.fabric_catalog_id = p_fabric_id AND v.is_public = true;

  RETURN COALESCE(v_variants, '[]'::jsonb);
END;
$$;

-- 9c. Images RPC
CREATE OR REPLACE FUNCTION public.rpc_get_public_fabric_images(p_fabric_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_images JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'variant_id', variant_id,
      'application_id', application_id,
      'type', type,
      'image_url', image_url,
      'display_order', display_order
    ) ORDER BY display_order ASC
  ) INTO v_images
  FROM public.fabric_images
  WHERE fabric_catalog_id = p_fabric_id;

  RETURN COALESCE(v_images, '[]'::jsonb);
END;
$$;

-- 9d. Related Products RPC (with Score Ranking Engine)
CREATE OR REPLACE FUNCTION public.rpc_get_related_public_fabrics(p_fabric_id UUID, p_limit INT DEFAULT 3)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current RECORD;
  v_result JSONB;
BEGIN
  SELECT technique, category_id, composition, target_gsm, thickness INTO v_current
  FROM public.fabric_catalogs
  WHERE id = p_fabric_id;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'code', code,
      'slug', slug,
      'name', name,
      'image_url', image_url,
      'composition', composition,
      'score', score
    )
  ) INTO v_result
  FROM (
    SELECT 
      fc.id, 
      fc.code, 
      fc.slug, 
      fc.name, 
      fc.image_url, 
      fc.composition,
      (
        -- Score Calculation
        (CASE WHEN fc.technique = v_current.technique THEN 50 ELSE 0 END) +
        (CASE WHEN fc.composition = v_current.composition THEN 30 ELSE 0 END) +
        (CASE WHEN fc.category_id = v_current.category_id THEN 25 ELSE 0 END) +
        (CASE WHEN ABS(COALESCE(fc.target_gsm, 0) - COALESCE(v_current.target_gsm, 0)) <= 30 THEN 15 ELSE 0 END) +
        (CASE WHEN fc.thickness = v_current.thickness THEN 10 ELSE 0 END) +
        LEAST(5, COALESCE(fc.view_count, 0) / 100)
      ) AS score
    FROM public.fabric_catalogs fc
    WHERE fc.is_public = true 
      AND fc.id != p_fabric_id
    ORDER BY score DESC, fc.created_at DESC
    LIMIT p_limit
  ) AS scored;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 9e. Collaborative Recommendation RPC (Also Viewed)
CREATE OR REPLACE FUNCTION public.rpc_get_also_viewed_public_fabrics(p_fabric_id UUID, p_limit INT DEFAULT 3)
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
      'code', code,
      'slug', slug,
      'name', name,
      'image_url', image_url,
      'composition', composition
    )
  ) INTO v_result
  FROM (
    SELECT fc.id, fc.code, fc.slug, fc.name, fc.image_url, fc.composition, COUNT(*) as match_count
    FROM public.fabric_public_views pv1
    JOIN public.fabric_public_views pv2 ON pv1.session_id = pv2.session_id
    JOIN public.fabric_catalogs fc ON pv2.fabric_catalog_id = fc.id
    WHERE pv1.fabric_catalog_id = p_fabric_id
      AND pv2.fabric_catalog_id != p_fabric_id
      AND fc.is_public = true
    GROUP BY fc.id, fc.code, fc.slug, fc.name, fc.image_url, fc.composition
    ORDER BY match_count DESC, fc.view_count DESC
    LIMIT p_limit
  ) AS collaborative;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
