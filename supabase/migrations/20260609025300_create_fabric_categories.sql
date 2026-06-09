-- 1. Create fabric_categories table
CREATE TABLE IF NOT EXISTS public.fabric_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    color_hint VARCHAR,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for fabric_categories
ALTER TABLE public.fabric_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép xem nhóm vải" ON public.fabric_categories FOR SELECT USING (true);
CREATE POLICY "Cho phép quản lý nhóm vải" ON public.fabric_categories 
  FOR ALL USING (current_user_role() IN ('admin', 'manager'));

-- 2. Seed standard categories
INSERT INTO public.fabric_categories (code, name, color_hint) VALUES
    ('SJ', 'Single Jersey', 'blue'),
    ('RB11', 'Rib 1x1', 'purple'),
    ('RB21', 'Rib 2x1', 'purple'),
    ('IL', 'Interlock', 'green'),
    ('TY', 'Terry', 'orange'),
    ('JQ', 'Jacquard', 'pink')
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    color_hint = EXCLUDED.color_hint;

-- 3. Add category_id to fabric_catalogs
ALTER TABLE public.fabric_catalogs 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.fabric_categories(id);

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_fabric_catalogs_category_id ON public.fabric_catalogs(category_id);
