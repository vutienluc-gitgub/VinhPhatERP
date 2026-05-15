-- =============================================================================
-- Migration: Add yarn technical attributes to yarn_catalogs
-- New columns: denier, filament_count, finish, color_status
-- =============================================================================

ALTER TABLE public.yarn_catalogs
  ADD COLUMN IF NOT EXISTS denier       TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS filament_count TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS finish       TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS color_status TEXT DEFAULT NULL;

COMMENT ON COLUMN public.yarn_catalogs.denier IS 'Denier (chi số sợi), VD: 75, 100, 150';
COMMENT ON COLUMN public.yarn_catalogs.filament_count IS 'Số filament, VD: 36, 48, 72, 144';
COMMENT ON COLUMN public.yarn_catalogs.finish IS 'Hiệu ứng bề mặt: bright, semi_dull, full_dull';
COMMENT ON COLUMN public.yarn_catalogs.color_status IS 'Trạng thái màu: raw_white, dope_dyed, dyed';
