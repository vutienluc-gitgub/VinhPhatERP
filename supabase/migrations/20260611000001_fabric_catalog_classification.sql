-- 1. Create Fabric Type Enum
CREATE TYPE public.fabric_type_enum AS ENUM ('knitted', 'woven');

-- 2. Modify fabric_categories table
ALTER TABLE public.fabric_categories
ADD COLUMN IF NOT EXISTS fabric_type public.fabric_type_enum DEFAULT 'knitted',
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.fabric_categories(id);

CREATE INDEX IF NOT EXISTS idx_fabric_categories_parent_id ON public.fabric_categories(parent_id);

-- 3. Modify fabric_catalogs table
ALTER TABLE public.fabric_catalogs
ADD COLUMN IF NOT EXISTS fabric_type public.fabric_type_enum DEFAULT 'knitted',
ADD COLUMN IF NOT EXISTS gauge INTEGER,
ADD COLUMN IF NOT EXISTS diameter INTEGER,
ADD COLUMN IF NOT EXISTS machine_type VARCHAR,
ADD COLUMN IF NOT EXISTS needle_count INTEGER,
ADD COLUMN IF NOT EXISTS warp_count VARCHAR,
ADD COLUMN IF NOT EXISTS weft_count VARCHAR,
ADD COLUMN IF NOT EXISTS epi INTEGER,
ADD COLUMN IF NOT EXISTS ppi INTEGER,
ADD COLUMN IF NOT EXISTS weave_pattern VARCHAR,
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_fabric_catalogs_fabric_type ON public.fabric_catalogs(fabric_type);

-- 4. Create Parent Categories (Knitted & Woven)
DO $$
DECLARE
    knitted_id UUID;
    woven_id UUID;
BEGIN
    -- Insert Parent Categories
    INSERT INTO public.fabric_categories (code, name, fabric_type) 
    VALUES ('KNIT', 'Knitted Fabric', 'knitted')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, fabric_type = EXCLUDED.fabric_type
    RETURNING id INTO knitted_id;

    INSERT INTO public.fabric_categories (code, name, fabric_type) 
    VALUES ('WOV', 'Woven Fabric', 'woven')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, fabric_type = EXCLUDED.fabric_type
    RETURNING id INTO woven_id;

    -- Link existing categories to Knitted Parent (since current are knitted)
    UPDATE public.fabric_categories 
    SET parent_id = knitted_id, fabric_type = 'knitted'
    WHERE code IN ('SJ', 'RB11', 'RB21', 'IL', 'TY', 'JQ', 'FLC', 'MSH', 'PQ') AND id != knitted_id;

    -- Insert Woven Child Categories
    INSERT INTO public.fabric_categories (code, name, fabric_type, parent_id, color_hint) VALUES
        ('POP', 'Poplin', 'woven', woven_id, 'blue'),
        ('TWL', 'Twill', 'woven', woven_id, 'green'),
        ('DNM', 'Denim', 'woven', woven_id, 'indigo'),
        ('CVS', 'Canvas', 'woven', woven_id, 'orange'),
        ('STN', 'Satin', 'woven', woven_id, 'pink'),
        ('KKA', 'Kaki', 'woven', woven_id, 'yellow')
    ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        fabric_type = EXCLUDED.fabric_type,
        parent_id = EXCLUDED.parent_id;

    -- Sync existing catalogs fabric_type based on category
    UPDATE public.fabric_catalogs fc
    SET fabric_type = cat.fabric_type
    FROM public.fabric_categories cat
    WHERE fc.category_id = cat.id;

END $$;
