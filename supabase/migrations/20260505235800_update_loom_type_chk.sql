-- Update loom_type constraint to allow knitting machine types
ALTER TABLE public.looms DROP CONSTRAINT looms_type_chk;

ALTER TABLE public.looms ADD CONSTRAINT looms_type_chk CHECK (
  loom_type IN (
    'rapier', 
    'air_jet', 
    'water_jet', 
    'shuttle', 
    'other',
    'single_jersey',
    'double_jersey',
    'warp_knitting',
    'flat_knitting',
    'accessories'
  )
);
