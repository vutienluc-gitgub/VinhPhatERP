-- Thêm 2 cột JSONB cho composition_tags và color_tags
ALTER TABLE public.fabric_catalogs
  ADD COLUMN IF NOT EXISTS composition_tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS color_tags JSONB DEFAULT '[]'::jsonb;

-- Cập nhật RPC rpc_get_public_fabric để trả về thêm hai trường này
CREATE OR REPLACE FUNCTION public.rpc_get_public_fabric(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
      'id', id,
      'code', code,
      'slug', slug,
      'name', name,
      'composition', composition,
      'composition_tags', composition_tags,
      'target_width_cm', target_width_cm,
      'target_gsm', target_gsm,
      'unit', unit,
      'image_url', image_url,
      'fabric_type', fabric_type,
      'weave_pattern', weave_pattern,
      'machine_type', machine_type,
      'color', color,
      'color_tags', color_tags,
      'technique', technique
    )
  INTO v_result
  FROM public.fabric_catalogs
  WHERE slug = p_slug
    AND is_public = true
  LIMIT 1;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.rpc_get_public_fabric(TEXT) IS 'Lấy thông tin public của mẫu vải bằng slug. Dành cho khách quét QR. (Có trả thêm tags)';
