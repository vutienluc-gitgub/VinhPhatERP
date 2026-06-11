-- Add missing fabric categories: Fleece, Mesh, Pique
INSERT INTO public.fabric_categories (code, name, color_hint) VALUES
    ('FL', 'Fleece', 'orange'),
    ('MS', 'Mesh', 'blue'),
    ('PQ', 'Pique', 'green')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    color_hint = EXCLUDED.color_hint;
