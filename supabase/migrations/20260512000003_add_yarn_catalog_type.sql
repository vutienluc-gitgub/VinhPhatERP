-- Migration: Add yarn_type to yarn_catalogs

ALTER TABLE public.yarn_catalogs 
ADD COLUMN IF NOT EXISTS yarn_type text;

COMMENT ON COLUMN public.yarn_catalogs.yarn_type IS 'Phân loại dòng sợi (VD: DTY, FDY, SCY, RCY, Spandex)';
