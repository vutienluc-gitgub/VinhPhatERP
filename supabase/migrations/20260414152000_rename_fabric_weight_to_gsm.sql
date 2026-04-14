-- Rename target_weight_kg to target_gsm in fabric_catalogs
ALTER TABLE "public"."fabric_catalogs" 
RENAME COLUMN "target_weight_kg" TO "target_gsm";
