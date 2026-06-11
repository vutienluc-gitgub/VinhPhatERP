-- Update colors for Fleece, Mesh, Pique
UPDATE public.fabric_categories SET color_hint = 'gray' WHERE code = 'FL';
UPDATE public.fabric_categories SET color_hint = 'purple' WHERE code = 'MS';
UPDATE public.fabric_categories SET color_hint = 'pink' WHERE code = 'PQ';
