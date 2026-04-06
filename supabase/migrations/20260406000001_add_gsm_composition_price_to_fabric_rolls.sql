-- 20260406_add_gsm_composition_price_to_fabric_rolls.sql
-- Thêm các trường GSM, composition, price_tier cho raw_fabric_rolls và finished_fabric_rolls
alter table public.raw_fabric_rolls
add column gsm integer,
    add column composition text,
    add column price_tier jsonb;
alter table public.finished_fabric_rolls
add column gsm integer,
    add column composition text,
    add column price_tier jsonb;