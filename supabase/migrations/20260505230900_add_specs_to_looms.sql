-- ============================================================
-- Migration: Add technical spec columns to looms table
-- Thêm thông số kỹ thuật máy dệt (từ EASTINO catalog)
-- ============================================================

DO $$
BEGIN
  -- Đường kính mâm dệt (inch)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'looms' AND column_name = 'diameter_inch'
  ) THEN
    ALTER TABLE public.looms ADD COLUMN diameter_inch numeric;
  END IF;

  -- Gauge (mật độ kim)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'looms' AND column_name = 'gauge'
  ) THEN
    ALTER TABLE public.looms ADD COLUMN gauge integer;
  END IF;

  -- Số feeder (đầu sợi)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'looms' AND column_name = 'feeders'
  ) THEN
    ALTER TABLE public.looms ADD COLUMN feeders integer;
  END IF;

  -- Công suất động cơ (kW)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'looms' AND column_name = 'motor_power_kw'
  ) THEN
    ALTER TABLE public.looms ADD COLUMN motor_power_kw numeric;
  END IF;

  -- Điện áp (VD: 380V/3P/50Hz)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'looms' AND column_name = 'voltage'
  ) THEN
    ALTER TABLE public.looms ADD COLUMN voltage text;
  END IF;

  -- Trọng lượng máy (kg)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'looms' AND column_name = 'weight_kg'
  ) THEN
    ALTER TABLE public.looms ADD COLUMN weight_kg numeric;
  END IF;
END $$;
