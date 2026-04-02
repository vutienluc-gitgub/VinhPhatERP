-- Add lot_number to finished_fabric_rolls and enforce raw_roll_id linkage
-- lot_number is auto-synced from the linked raw_fabric_rolls row
-- 1. Add lot_number column
alter table finished_fabric_rolls
add column if not exists lot_number text;
create index if not exists idx_finished_rolls_lot_number on finished_fabric_rolls (lot_number)
where lot_number is not null;
-- 2. Backfill lot_number from existing linked raw rolls
update finished_fabric_rolls f
set lot_number = r.lot_number
from raw_fabric_rolls r
where f.raw_roll_id = r.id
    and f.lot_number is null
    and r.lot_number is not null;
-- 3. Make raw_roll_id NOT NULL (every finished roll must link to a raw roll)
-- First set any orphan rows to prevent constraint failure
-- (if there are rows without raw_roll_id, this migration will fail intentionally
--  so you can fix them manually before re-running)
alter table finished_fabric_rolls
alter column raw_roll_id
set not null;
-- 4. Trigger: auto-sync lot_number from raw roll and validate on insert/update
create or replace function fn_finished_fabric_sync_lot() returns trigger as $$
declare raw_lot text;
begin -- Always look up lot_number from the linked raw roll
select lot_number into raw_lot
from raw_fabric_rolls
where id = NEW.raw_roll_id;
if not found then raise exception 'Cuộn vải mộc nguồn (raw_roll_id = %) không tồn tại',
NEW.raw_roll_id;
end if;
-- Auto-sync lot_number from raw roll
NEW.lot_number := raw_lot;
return NEW;
end;
$$ language plpgsql;
drop trigger if exists trg_finished_fabric_sync_lot on finished_fabric_rolls;
create trigger trg_finished_fabric_sync_lot before
insert
    or
update of raw_roll_id on finished_fabric_rolls for each row execute function fn_finished_fabric_sync_lot();