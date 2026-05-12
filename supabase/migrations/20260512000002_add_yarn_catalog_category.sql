-- Migration: Add category to yarn_catalogs

ALTER TABLE public.yarn_catalogs 
ADD COLUMN IF NOT EXISTS category text;

COMMENT ON COLUMN public.yarn_catalogs.category IS 'Phân loại nhóm sợi (VD: Core Yarns, Specialty Yarns)';
