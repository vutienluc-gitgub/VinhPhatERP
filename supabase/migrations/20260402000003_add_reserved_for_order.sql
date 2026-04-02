-- Add reserved_for_order_id to finished_fabric_rolls
-- Allows tracking which order has reserved a specific roll.
alter table finished_fabric_rolls
add column if not exists reserved_for_order_id uuid references orders(id) on delete
set null;
create index if not exists idx_finished_rolls_reserved_order on finished_fabric_rolls (reserved_for_order_id)
where reserved_for_order_id is not null;