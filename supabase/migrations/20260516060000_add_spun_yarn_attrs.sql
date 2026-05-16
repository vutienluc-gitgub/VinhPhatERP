-- =============================================================================
-- Migration: Add spun yarn attributes to yarn_catalogs
-- Support for cotton/blended yarn metrics (Ne count, spinning, twist, certs)
-- Based on industry standards from Nitin Spinners and global textile norms.
-- =============================================================================

ALTER TABLE public.yarn_catalogs
  ADD COLUMN IF NOT EXISTS count_ne        TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS spinning_method TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS twist_type      TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS certifications  TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_fancy        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fancy_details   TEXT DEFAULT NULL;

COMMENT ON COLUMN public.yarn_catalogs.count_ne IS 'Chi so soi English Count, VD: Ne 12, Ne 30, Ne 100';
COMMENT ON COLUMN public.yarn_catalogs.spinning_method IS 'Phuong phap keo soi: Ring Spun, Compact, Open End, Vortex, Siro';
COMMENT ON COLUMN public.yarn_catalogs.twist_type IS 'Huong xoan: S-Twist, Z-Twist, Zero-Twist, Eli-Twist';
COMMENT ON COLUMN public.yarn_catalogs.certifications IS 'Chung chi: BCI, GOTS, OCS, Supima, Giza, GRS...';
COMMENT ON COLUMN public.yarn_catalogs.is_fancy IS 'La soi fancy (slub, injection...)?';
COMMENT ON COLUMN public.yarn_catalogs.fancy_details IS 'Mo ta chi tiet kieu fancy: slub pattern, core structure...';
