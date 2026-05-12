-- Migration: RPC delete fabric catalog with protection
-- Prevents deletion if referenced by BOM, variants, or production rolls.

CREATE OR REPLACE FUNCTION rpc_delete_fabric_catalog(p_fabric_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check 1: BOM Templates reference
  IF EXISTS (
    SELECT 1 FROM bom_templates
    WHERE target_fabric_id = p_fabric_id
  ) THEN
    RAISE EXCEPTION 'Không thể xóa: Mã vải đang được sử dụng trong BOM (Định mức nguyên liệu)';
  END IF;

  -- Check 2: Fabric Variants still exist
  IF EXISTS (
    SELECT 1 FROM fabric_variants
    WHERE fabric_catalog_id = p_fabric_id
  ) THEN
    RAISE EXCEPTION 'Không thể xóa: Mã vải còn biến thể màu. Hãy xóa hết biến thể trước.';
  END IF;

  -- Check 3: Raw fabric rolls (text match on fabric_type = code)
  IF EXISTS (
    SELECT 1 FROM raw_fabric_rolls rfr
    INNER JOIN fabric_catalogs fc ON fc.id = p_fabric_id
    WHERE rfr.fabric_type = fc.code
  ) THEN
    RAISE EXCEPTION 'Không thể xóa: Mã vải đã có cuộn vải mộc trong kho';
  END IF;

  -- Check 4: Finished fabric rolls (text match on fabric_type = code)
  IF EXISTS (
    SELECT 1 FROM finished_fabric_rolls ffr
    INNER JOIN fabric_catalogs fc ON fc.id = p_fabric_id
    WHERE ffr.fabric_type = fc.code
  ) THEN
    RAISE EXCEPTION 'Không thể xóa: Mã vải đã có cuộn vải thành phẩm trong kho';
  END IF;

  -- Safe to delete
  DELETE FROM fabric_catalogs WHERE id = p_fabric_id;
END;
$$;

COMMENT ON FUNCTION rpc_delete_fabric_catalog IS 'Xoa ma vai voi bao ve: kiem tra BOM, variants, cuon vai moc/thanh pham truoc khi xoa.';
