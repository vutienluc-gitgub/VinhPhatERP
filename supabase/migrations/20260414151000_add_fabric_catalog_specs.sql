-- Add Target Spec to fabric_catalogs
ALTER TABLE "public"."fabric_catalogs"
ADD COLUMN "target_width_cm" numeric(10,2),
ADD COLUMN "target_weight_kg" numeric(10,2);

-- Update RLS if necessary (none required for adding columns to existing RLS table usually, but good practice to be aware)
