-- Migration: Thêm tính năng Public Fabric Catalog
-- 1. Thêm cột is_public và slug
ALTER TABLE public.fabric_catalogs
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Tự động generate slug từ code cho các record cũ (Bỏ ký tự đặc biệt, chuyển thành chữ thường, thay khoảng trắng bằng gạch nối)
UPDATE public.fabric_catalogs
SET slug = lower(regexp_replace(code, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Đảm bảo slug không được NULL sau khi update
ALTER TABLE public.fabric_catalogs
  ALTER COLUMN slug SET NOT NULL;

-- 3. Tạo Unique Constraint cho slug theo tenant
ALTER TABLE public.fabric_catalogs
  ADD CONSTRAINT fabric_catalogs_slug_tenant_id_key UNIQUE (slug, tenant_id);

-- 4. Tạo RPC function để lấy thông tin công khai (Bypass RLS)
-- RPC này trả về JSON object chứa các field public, chỉ khi is_public = true.
CREATE OR REPLACE FUNCTION public.rpc_get_public_fabric(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Chạy với quyền của người tạo function (thường là postgres/owner) để bypass RLS
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
      'machine_type', machine_type
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
