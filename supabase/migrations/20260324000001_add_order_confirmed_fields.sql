-- =============================================================================
-- Migration 0005: Thêm trường xác nhận vào bảng orders
--                 confirmed_by: uuid người xác nhận
--                 confirmed_at: thời điểm xác nhận
-- =============================================================================

alter table orders
  add column if not exists confirmed_by uuid references profiles(id),
  add column if not exists confirmed_at timestamptz;

create index if not exists idx_orders_confirmed_by
  on orders (confirmed_by)
  where confirmed_by is not null;
