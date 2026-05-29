-- =============================================================================
-- Migration: Add manufacturer & model to looms table
-- Description: Thêm trường hãng sản xuất và model máy dệt
-- =============================================================================

ALTER TABLE public.looms
  ADD COLUMN IF NOT EXISTS manufacturer TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS country_of_origin TEXT;

COMMENT ON COLUMN public.looms.manufacturer IS 'Hãng sản xuất máy: Mayer & Cie, Fukuhara, Wellknit, Baiyuan...';
COMMENT ON COLUMN public.looms.model IS 'Model máy: MV 4-3.2 II, V-SJ5E, WKSJ32...';
COMMENT ON COLUMN public.looms.country_of_origin IS 'Xuất xứ: Đức, Nhật, Đài Loan, Trung Quốc...';
