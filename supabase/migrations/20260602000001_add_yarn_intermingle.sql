-- Add intermingle field to yarn_catalogs for Filament yarns (NIM, SIM, HIM)
ALTER TABLE public.yarn_catalogs
ADD COLUMN intermingle text;
