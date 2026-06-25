-- Upgrade public.fabric_images with new metadata fields
ALTER TABLE public.fabric_images
  ADD COLUMN IF NOT EXISTS alt_text TEXT,
  ADD COLUMN IF NOT EXISTS caption TEXT,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Update the type check constraint to include COMPOSITION and CERTIFICATE
ALTER TABLE public.fabric_images DROP CONSTRAINT IF EXISTS fabric_images_type_check;
ALTER TABLE public.fabric_images ADD CONSTRAINT fabric_images_type_check 
CHECK (type IN ('SWATCH', 'SURFACE', 'BACK', 'STRETCH', 'APPLICATION', 'COMPOSITION', 'CERTIFICATE'));

-- Update the read RPC to include new fields
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
      'alt_text', alt_text,
      'caption', caption,
      'is_primary', is_primary,
      'display_order', display_order
    ) ORDER BY display_order ASC
  ) INTO v_images
  FROM public.fabric_images
  WHERE fabric_catalog_id = p_fabric_id;

  RETURN COALESCE(v_images, '[]'::jsonb);
END;
$$;

-- Create RPC for Syncing Fabric Images (UPSERT + DELETE)
CREATE OR REPLACE FUNCTION public.rpc_sync_fabric_images(
  p_fabric_id UUID,
  p_images JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item JSONB;
  v_keep_ids UUID[] := '{}';
BEGIN
  -- Process each image in the array
  IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_images)
    LOOP
      IF v_item->>'id' IS NOT NULL AND v_item->>'id' != '' THEN
        -- UPDATE existing
        UPDATE public.fabric_images
        SET 
          type = v_item->>'type',
          image_url = v_item->>'image_url',
          alt_text = v_item->>'alt_text',
          caption = v_item->>'caption',
          is_primary = COALESCE((v_item->>'is_primary')::BOOLEAN, false),
          display_order = COALESCE((v_item->>'display_order')::INTEGER, 0)
        WHERE id = (v_item->>'id')::UUID 
          AND fabric_catalog_id = p_fabric_id;
          
        v_keep_ids := array_append(v_keep_ids, (v_item->>'id')::UUID);
      ELSE
        -- INSERT new
        DECLARE
          v_new_id UUID := gen_random_uuid();
        BEGIN
          INSERT INTO public.fabric_images (
            id,
            fabric_catalog_id,
            type,
            image_url,
            alt_text,
            caption,
            is_primary,
            display_order
          ) VALUES (
            v_new_id,
            p_fabric_id,
            v_item->>'type',
            v_item->>'image_url',
            v_item->>'alt_text',
            v_item->>'caption',
            COALESCE((v_item->>'is_primary')::BOOLEAN, false),
            COALESCE((v_item->>'display_order')::INTEGER, 0)
          );
          v_keep_ids := array_append(v_keep_ids, v_new_id);
        END;
      END IF;
    END LOOP;
  END IF;

  -- DELETE removed items
  DELETE FROM public.fabric_images 
  WHERE fabric_catalog_id = p_fabric_id 
    AND id != ALL(v_keep_ids);

END;
$$;
