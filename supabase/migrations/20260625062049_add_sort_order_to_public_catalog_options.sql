-- Add sort_order to characteristics and applications

ALTER TABLE public.characteristics
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Optional: Seed data for testing, though user may configure this in settings later
INSERT INTO public.characteristics (name, icon, sort_order)
VALUES 
  ('Thấm hút', 'Droplets', 1),
  ('Thoáng khí', 'Wind', 2),
  ('Co giãn', 'MoveHorizontal', 3),
  ('Mềm mại', 'Feather', 4),
  ('Bền màu', 'Palette', 5),
  ('Kháng khuẩn', 'Shield', 6),
  ('Chống tia UV', 'Sun', 7)
ON CONFLICT DO NOTHING;

INSERT INTO public.applications (name, slug, icon, sort_order)
VALUES 
  ('Áo thun', 'ao-thun', 'Shirt', 1),
  ('Áo Polo', 'ao-polo', 'Shirt', 2),
  ('Đồ thể thao', 'do-the-thao', 'Activity', 3),
  ('Đồ trẻ em', 'do-tre-em', 'Baby', 4),
  ('Đồ lót', 'do-lot', 'Box', 5),
  ('Đồng phục', 'dong-phuc', 'Users', 6)
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order;
