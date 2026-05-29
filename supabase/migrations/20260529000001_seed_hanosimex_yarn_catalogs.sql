-- =============================================================================
-- Migration: Seed Hanosimex Yarn Catalogs
-- Description: Thêm các danh mục sợi dựa trên dữ liệu sản phẩm từ Hanosimex
-- =============================================================================

INSERT INTO public.yarn_catalogs (code, name, category, yarn_type, composition, origin, unit, notes)
VALUES
  -- Nhóm: Sợi OE
  ('HANO_OE', 'Sợi OE các loại', 'Sợi OE', 'Open End', NULL, 'Hanosimex', 'kg', 'Sợi OE thông dụng'),
  
  -- Nhóm: Sợi Se (Twisted / PE / Texture)
  ('HANO_PE', 'Sợi PE', 'Sợi Se', 'PE', '100% Polyester', 'Hanosimex', 'kg', NULL),
  ('HANO_BLEND', 'Sợi pha', 'Sợi Se', 'Pha', 'Blend', 'Hanosimex', 'kg', NULL),
  ('HANO_COTTON', 'Sợi cotton', 'Sợi Se', 'Cotton', '100% Cotton', 'Hanosimex', 'kg', NULL),
  
  -- Nhóm: Sợi nồi cọc (Ring Spun)
  ('HANO_COT_CM', 'Sợi cotton chải kỹ các loại', 'Sợi nồi cọc', 'Ring Spun', '100% Cotton (Combed)', 'Hanosimex', 'kg', 'Sợi chải kỹ chất lượng cao'),
  ('HANO_COT_CD', 'Sợi cotton chải thô các loại', 'Sợi nồi cọc', 'Ring Spun', '100% Cotton (Carded)', 'Hanosimex', 'kg', 'Sợi chải thô tiêu chuẩn'),
  ('HANO_POLY', 'Sợi Polyester các loại', 'Sợi nồi cọc', 'Ring Spun', '100% Polyester', 'Hanosimex', 'kg', NULL),
  ('HANO_TCD_TCM', 'Sợi pha các loại TCD, TCM', 'Sợi nồi cọc', 'Ring Spun', 'Poly/Cotton Blend', 'Hanosimex', 'kg', 'Bao gồm TCD, TCM'),
  ('HANO_TEXTURE', 'Sợi texture', 'Sợi nồi cọc', 'Texture', NULL, 'Hanosimex', 'kg', NULL),
  ('HANO_COT_SEMI', 'Sợi cotton bán chải kỹ các loại', 'Sợi nồi cọc', 'Ring Spun', '100% Cotton (Semi-combed)', 'Hanosimex', 'kg', 'Sợi bán chải kỹ'),
  ('HANO_SLUB', 'Sợi Slub', 'Sợi nồi cọc', 'Slub', NULL, 'Hanosimex', 'kg', 'Sợi tạo hiệu ứng slub')
ON CONFLICT (code, tenant_id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  yarn_type = EXCLUDED.yarn_type,
  composition = EXCLUDED.composition,
  origin = EXCLUDED.origin,
  notes = EXCLUDED.notes;
