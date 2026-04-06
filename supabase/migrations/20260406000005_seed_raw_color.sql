-- Insert 'Raw' (Mộc) color
INSERT INTO public.colors (code, name)
VALUES ('RAW', 'Mộc (Raw)')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
