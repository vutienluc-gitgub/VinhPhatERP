-- Add new columns to fabric_catalogs
ALTER TABLE public.fabric_catalogs 
  ADD COLUMN IF NOT EXISTS applications jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS characteristics jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stretch_type text CHECK (stretch_type IN ('NONE', 'HORIZONTAL', 'VERTICAL', 'TWO_WAY', 'FOUR_WAY')),
  ADD COLUMN IF NOT EXISTS thickness text CHECK (thickness IN ('THIN', 'MEDIUM', 'THICK', 'EXTRA_THICK')),
  ADD COLUMN IF NOT EXISTS stock_status text CHECK (stock_status IN ('SAMPLE_AVAILABLE', 'READY_STOCK', 'CUSTOM_ORDER', 'OUT_OF_STOCK')),
  ADD COLUMN IF NOT EXISTS minimum_order_qty numeric,
  ADD COLUMN IF NOT EXISTS minimum_order_unit text,
  ADD COLUMN IF NOT EXISTS lead_time_min integer,
  ADD COLUMN IF NOT EXISTS lead_time_max integer,
  ADD COLUMN IF NOT EXISTS lead_time_unit text,
  ADD COLUMN IF NOT EXISTS public_images text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Add new columns to fabric_variants
ALTER TABLE public.fabric_variants
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS public_image_url text;

-- Create index for related products query
CREATE INDEX IF NOT EXISTS idx_fabric_catalogs_technique_category 
ON public.fabric_catalogs(technique, category_id, created_at DESC);

-- Update rpc_get_public_fabric to increment view_count and return new fields + variants
CREATE OR REPLACE FUNCTION public.rpc_get_public_fabric(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fabric RECORD;
  v_variants JSONB;
BEGIN
  -- Increment view count and get fabric
  UPDATE public.fabric_catalogs
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE slug = p_slug AND is_public = true
  RETURNING * INTO v_fabric;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Get variants
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'variant_code', variant_code,
      'color_name', color_name,
      'color_hex', color_hex,
      'public_image_url', public_image_url,
      'is_public', is_public,
      'display_order', display_order
    ) ORDER BY display_order ASC
  )
  INTO v_variants
  FROM public.fabric_variants
  WHERE fabric_catalog_id = v_fabric.id AND is_public = true;

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
    'machine_type', v_fabric.machine_type,
    'color', v_fabric.color,
    'color_tags', v_fabric.color_tags,
    'technique', v_fabric.technique,
    'applications', v_fabric.applications,
    'characteristics', v_fabric.characteristics,
    'stretch_type', v_fabric.stretch_type,
    'thickness', v_fabric.thickness,
    'stock_status', v_fabric.stock_status,
    'minimum_order_qty', v_fabric.minimum_order_qty,
    'minimum_order_unit', v_fabric.minimum_order_unit,
    'lead_time_min', v_fabric.lead_time_min,
    'lead_time_max', v_fabric.lead_time_max,
    'lead_time_unit', v_fabric.lead_time_unit,
    'public_images', v_fabric.public_images,
    'view_count', v_fabric.view_count,
    'variants', COALESCE(v_variants, '[]'::jsonb)
  );
END;
$$;

-- Create RPC for related public fabrics
CREATE OR REPLACE FUNCTION public.rpc_get_related_public_fabrics(p_fabric_id UUID, p_limit INT DEFAULT 3)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current RECORD;
  v_result JSONB;
BEGIN
  -- Lấy thông tin technique và category của mẫu hiện tại
  SELECT technique, category_id INTO v_current
  FROM public.fabric_catalogs
  WHERE id = p_fabric_id;

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
    SELECT *
    FROM public.fabric_catalogs
    WHERE is_public = true 
      AND id != p_fabric_id
      AND (
        -- Ưu tiên cùng technique, sau đó cùng category, fallback là mới nhất
        -- Order by logic:
        -- same technique = 0, diff = 1
        -- same category = 0, diff = 1
        -- then created_at DESC
        true
      )
    ORDER BY 
      CASE WHEN technique = v_current.technique THEN 0 ELSE 1 END ASC,
      CASE WHEN category_id = v_current.category_id THEN 0 ELSE 1 END ASC,
      created_at DESC
    LIMIT p_limit
  ) AS related;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

