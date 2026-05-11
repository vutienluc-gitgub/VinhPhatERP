-- Migration: Add image_url column to fabric_catalogs
-- Stores the public URL of the catalog product image (compressed WebP)

ALTER TABLE fabric_catalogs
  ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN fabric_catalogs.image_url
  IS 'Public URL of the catalog product image (compressed WebP). Uploaded to public-media bucket.';
