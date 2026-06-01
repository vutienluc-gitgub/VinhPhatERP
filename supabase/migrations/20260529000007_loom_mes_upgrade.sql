-- Nâng cấp bảng looms để hỗ trợ hệ thống MES-lite

-- 1. Bổ sung các cột thông số cấu hình mới
ALTER TABLE public.looms 
  ADD COLUMN IF NOT EXISTS needles integer,
  ADD COLUMN IF NOT EXISTS gsm_range text,
  ADD COLUMN IF NOT EXISTS yarn_support text,
  ADD COLUMN IF NOT EXISTS daily_capacity_kg numeric;

-- 2. Cập nhật Constraint cho Status
ALTER TABLE public.looms DROP CONSTRAINT IF EXISTS looms_status_chk;

-- Migrate existing data
UPDATE public.looms SET status = 'running' WHERE status = 'active';
UPDATE public.looms SET status = 'idle' WHERE status = 'inactive';

ALTER TABLE public.looms ADD CONSTRAINT looms_status_chk CHECK (
  status IN ('running', 'idle', 'maintenance', 'breakdown', 'setup')
);

-- 4. Cập nhật Constraint cho Loom Type (Machine Family)
ALTER TABLE public.looms DROP CONSTRAINT IF EXISTS looms_type_chk;
ALTER TABLE public.looms ADD CONSTRAINT looms_type_chk CHECK (
  loom_type IN (
    'single_jersey',
    'double_jersey',
    'rib',
    'interlock',
    'terry',
    'jacquard',
    'open_width',
    'flat_knitting',
    'warp_knitting',
    'rapier',
    'air_jet',
    'water_jet',
    'shuttle',
    'accessories',
    'other'
  )
);
