-- Migration: Add image_url column to finished_fabric_rolls
-- Stores the public URL of the compressed product image (WebP, ~200KB)

ALTER TABLE finished_fabric_rolls
  ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN finished_fabric_rolls.image_url
  IS 'Public URL of the product image (compressed WebP). Uploaded to public-media bucket.';
