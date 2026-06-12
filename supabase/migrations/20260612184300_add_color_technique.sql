-- Thêm cột color và technique cho fabric_catalogs
ALTER TABLE public.fabric_catalogs
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS technique TEXT;

-- Cập nhật lại rpc_get_public_fabric để trả về thêm color và technique
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
      'target_width_cm', target_width_cm,
      'target_gsm', target_gsm,
      'unit', unit,
      'image_url', image_url,
      'fabric_type', fabric_type,
      'weave_pattern', weave_pattern,
      'machine_type', machine_type,
      'color', color,
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

COMMENT ON FUNCTION public.rpc_get_public_fabric(TEXT) IS 'Lấy thông tin public của mẫu vải bằng slug. Dành cho khách quét QR.';
