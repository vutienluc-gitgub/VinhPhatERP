-- =============================================================================
-- Safe re-run script — skips objects that already exist
-- Run this in Supabase SQL Editor if 0001_initial_schema.sql partially failed
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- 1. Helper function
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Enum types (safe — skip if already exists)
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin', 'manager', 'staff', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type active_status as enum ('active', 'inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type doc_status as enum ('draft', 'confirmed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('draft', 'confirmed', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type production_stage as enum (
    'warping', 'weaving', 'greige_check', 'dyeing', 'finishing', 'final_check', 'packing'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type stage_status as enum ('pending', 'in_progress', 'done', 'skipped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type roll_status as enum (
    'in_stock', 'reserved', 'in_process', 'shipped', 'damaged', 'written_off'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type shipment_status as enum (
    'preparing', 'shipped', 'delivered', 'partially_returned', 'returned'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('cash', 'bank_transfer', 'check', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type adjustment_type as enum ('increase', 'decrease', 'correction');
exception when duplicate_object then null; end $$;

do $$ begin
  create type supplier_category as enum ('yarn', 'dye', 'accessories', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type inventory_item_type as enum ('yarn', 'raw_fabric', 'finished_fabric');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 3. Tables
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text        not null default '',
  role        user_role   not null default 'staff',
  phone       text,
  avatar_url  text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists customers (
  id             uuid          primary key default uuid_generate_v4(),
  code           text          not null unique,
  name           text          not null,
  phone          text,
  email          text,
  address        text,
  tax_code       text,
  contact_person text,
  notes          text,
  status         active_status not null default 'active',
  created_at     timestamptz   not null default now(),
  updated_at     timestamptz   not null default now()
);

create table if not exists suppliers (
  id             uuid              primary key default uuid_generate_v4(),
  code           text              not null unique,
  name           text              not null,
  category       supplier_category not null default 'other',
  phone          text,
  email          text,
  address        text,
  tax_code       text,
  contact_person text,
  notes          text,
  status         active_status     not null default 'active',
  created_at     timestamptz       not null default now(),
  updated_at     timestamptz       not null default now()
);

create table if not exists yarn_receipts (
  id             uuid          primary key default uuid_generate_v4(),
  receipt_number text          not null unique,
  supplier_id    uuid          not null references suppliers(id),
  receipt_date   date          not null default current_date,
  total_amount   numeric(18,2) not null default 0 check (total_amount >= 0),
  status         doc_status    not null default 'draft',
  notes          text,
  created_by     uuid          references profiles(id),
  created_at     timestamptz   not null default now(),
  updated_at     timestamptz   not null default now()
);

create table if not exists yarn_receipt_items (
  id          uuid          primary key default uuid_generate_v4(),
  receipt_id  uuid          not null references yarn_receipts(id) on delete cascade,
  yarn_type   text          not null,
  color_name  text,
  color_code  text,
  unit        text          not null default 'kg',
  quantity    numeric(14,3) not null check (quantity > 0),
  unit_price  numeric(18,2) not null default 0 check (unit_price >= 0),
  amount      numeric(18,2) generated always as (quantity * unit_price) stored,
  notes       text,
  sort_order  smallint      not null default 0
);

create table if not exists raw_fabric_rolls (
  id                uuid        primary key default uuid_generate_v4(),
  roll_number       text        not null unique,
  yarn_receipt_id   uuid        references yarn_receipts(id),
  fabric_type       text        not null,
  color_name        text,
  color_code        text,
  width_cm          numeric(7,2),
  length_m          numeric(10,3),
  weight_kg         numeric(10,3),
  quality_grade     char(1)     check (quality_grade in ('A','B','C')),
  status            roll_status not null default 'in_stock',
  warehouse_location text,
  production_date   date,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists finished_fabric_rolls (
  id                uuid        primary key default uuid_generate_v4(),
  roll_number       text        not null unique,
  raw_roll_id       uuid        references raw_fabric_rolls(id),
  fabric_type       text        not null,
  color_name        text,
  color_code        text,
  width_cm          numeric(7,2),
  length_m          numeric(10,3),
  weight_kg         numeric(10,3),
  quality_grade     char(1)     check (quality_grade in ('A','B','C')),
  status            roll_status not null default 'in_stock',
  warehouse_location text,
  production_date   date,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists orders (
  id              uuid          primary key default uuid_generate_v4(),
  order_number    text          not null unique,
  customer_id     uuid          not null references customers(id),
  order_date      date          not null default current_date,
  delivery_date   date,
  total_amount    numeric(18,2) not null default 0 check (total_amount >= 0),
  paid_amount     numeric(18,2) not null default 0 check (paid_amount >= 0),
  status          order_status  not null default 'draft',
  notes           text,
  created_by      uuid          references profiles(id),
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

create table if not exists order_items (
  id           uuid          primary key default uuid_generate_v4(),
  order_id     uuid          not null references orders(id) on delete cascade,
  fabric_type  text          not null,
  color_name   text,
  color_code   text,
  quantity     numeric(14,3) not null check (quantity > 0),
  unit         text          not null default 'm',
  unit_price   numeric(18,2) not null default 0 check (unit_price >= 0),
  amount       numeric(18,2) generated always as (quantity * unit_price) stored,
  notes        text,
  sort_order   smallint      not null default 0
);

create table if not exists order_progress (
  id            uuid             primary key default uuid_generate_v4(),
  order_id      uuid             not null references orders(id) on delete cascade,
  stage         production_stage not null,
  status        stage_status     not null default 'pending',
  planned_date  date,
  actual_date   date,
  notes         text,
  updated_by    uuid             references profiles(id),
  created_at    timestamptz      not null default now(),
  updated_at    timestamptz      not null default now(),
  unique (order_id, stage)
);

create table if not exists shipments (
  id                uuid            primary key default uuid_generate_v4(),
  shipment_number   text            not null unique,
  order_id          uuid            not null references orders(id),
  customer_id       uuid            not null references customers(id),
  shipment_date     date            not null default current_date,
  delivery_address  text,
  carrier           text,
  tracking_number   text,
  status            shipment_status not null default 'preparing',
  notes             text,
  created_by        uuid            references profiles(id),
  created_at        timestamptz     not null default now(),
  updated_at        timestamptz     not null default now()
);

create table if not exists shipment_items (
  id               uuid          primary key default uuid_generate_v4(),
  shipment_id      uuid          not null references shipments(id) on delete cascade,
  finished_roll_id uuid          references finished_fabric_rolls(id),
  fabric_type      text          not null,
  color_name       text,
  quantity         numeric(14,3) not null check (quantity > 0),
  unit             text          not null default 'm',
  notes            text,
  sort_order       smallint      not null default 0
);

create table if not exists payments (
  id               uuid           primary key default uuid_generate_v4(),
  payment_number   text           not null unique,
  order_id         uuid           not null references orders(id),
  customer_id      uuid           not null references customers(id),
  payment_date     date           not null default current_date,
  amount           numeric(18,2)  not null check (amount > 0),
  payment_method   payment_method not null default 'bank_transfer',
  reference_number text,
  notes            text,
  created_by       uuid           references profiles(id),
  created_at       timestamptz    not null default now(),
  updated_at       timestamptz    not null default now()
);

create table if not exists inventory_adjustments (
  id              uuid                primary key default uuid_generate_v4(),
  adjustment_date date                not null default current_date,
  item_type       inventory_item_type not null,
  reference_id    uuid,
  adjustment_type adjustment_type     not null,
  quantity_delta  numeric(14,3)       not null,
  reason          text                not null,
  notes           text,
  created_by      uuid                references profiles(id),
  created_at      timestamptz         not null default now()
);

create table if not exists settings (
  id          uuid        primary key default uuid_generate_v4(),
  key         text        not null unique,
  value       text,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Indexes (IF NOT EXISTS — PG 9.5+)
-- ---------------------------------------------------------------------------
create index if not exists idx_customers_name   on customers using gin (name gin_trgm_ops);
create index if not exists idx_customers_code   on customers (code);
create index if not exists idx_customers_status on customers (status);

create index if not exists idx_suppliers_name     on suppliers using gin (name gin_trgm_ops);
create index if not exists idx_suppliers_code     on suppliers (code);
create index if not exists idx_suppliers_category on suppliers (category);

create index if not exists idx_yarn_receipts_supplier on yarn_receipts (supplier_id);
create index if not exists idx_yarn_receipts_date     on yarn_receipts (receipt_date desc);
create index if not exists idx_yarn_receipts_status   on yarn_receipts (status);
create index if not exists idx_yri_receipt            on yarn_receipt_items (receipt_id);

create index if not exists idx_raw_rolls_status      on raw_fabric_rolls (status);
create index if not exists idx_raw_rolls_fabric_type on raw_fabric_rolls (fabric_type);
create index if not exists idx_raw_rolls_receipt     on raw_fabric_rolls (yarn_receipt_id);

create index if not exists idx_finished_rolls_status      on finished_fabric_rolls (status);
create index if not exists idx_finished_rolls_fabric_type on finished_fabric_rolls (fabric_type);
create index if not exists idx_finished_rolls_raw_roll    on finished_fabric_rolls (raw_roll_id);

create index if not exists idx_orders_customer on orders (customer_id);
create index if not exists idx_orders_date     on orders (order_date desc);
create index if not exists idx_orders_status   on orders (status);
create index if not exists idx_order_items_order on order_items (order_id);

create index if not exists idx_order_progress_order  on order_progress (order_id);
create index if not exists idx_order_progress_status on order_progress (status);

create index if not exists idx_shipments_order    on shipments (order_id);
create index if not exists idx_shipments_customer on shipments (customer_id);
create index if not exists idx_shipments_date     on shipments (shipment_date desc);
create index if not exists idx_shipments_status   on shipments (status);
create index if not exists idx_shipment_items_shipment on shipment_items (shipment_id);
create index if not exists idx_shipment_items_roll     on shipment_items (finished_roll_id);

create index if not exists idx_payments_order    on payments (order_id);
create index if not exists idx_payments_customer on payments (customer_id);
create index if not exists idx_payments_date     on payments (payment_date desc);

create index if not exists idx_inv_adj_date      on inventory_adjustments (adjustment_date desc);
create index if not exists idx_inv_adj_item_type on inventory_adjustments (item_type);

-- ---------------------------------------------------------------------------
-- 5. Triggers (drop + recreate to be safe)
-- ---------------------------------------------------------------------------
drop trigger if exists trg_profiles_updated_at       on profiles;
drop trigger if exists trg_customers_updated_at      on customers;
drop trigger if exists trg_suppliers_updated_at      on suppliers;
drop trigger if exists trg_yarn_receipts_updated_at  on yarn_receipts;
drop trigger if exists trg_raw_fabric_rolls_updated_at  on raw_fabric_rolls;
drop trigger if exists trg_finished_fabric_rolls_updated_at on finished_fabric_rolls;
drop trigger if exists trg_orders_updated_at         on orders;
drop trigger if exists trg_order_progress_updated_at on order_progress;
drop trigger if exists trg_shipments_updated_at      on shipments;
drop trigger if exists trg_payments_updated_at       on payments;
drop trigger if exists trg_settings_updated_at       on settings;
drop trigger if exists trg_on_auth_user_created      on auth.users;
drop trigger if exists trg_payments_sync_paid        on payments;

create trigger trg_profiles_updated_at
  before update on profiles for each row execute function set_updated_at();
create trigger trg_customers_updated_at
  before update on customers for each row execute function set_updated_at();
create trigger trg_suppliers_updated_at
  before update on suppliers for each row execute function set_updated_at();
create trigger trg_yarn_receipts_updated_at
  before update on yarn_receipts for each row execute function set_updated_at();
create trigger trg_raw_fabric_rolls_updated_at
  before update on raw_fabric_rolls for each row execute function set_updated_at();
create trigger trg_finished_fabric_rolls_updated_at
  before update on finished_fabric_rolls for each row execute function set_updated_at();
create trigger trg_orders_updated_at
  before update on orders for each row execute function set_updated_at();
create trigger trg_order_progress_updated_at
  before update on order_progress for each row execute function set_updated_at();
create trigger trg_shipments_updated_at
  before update on shipments for each row execute function set_updated_at();
create trigger trg_payments_updated_at
  before update on payments for each row execute function set_updated_at();
create trigger trg_settings_updated_at
  before update on settings for each row execute function set_updated_at();

-- Auto-create profile on new user
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;
create trigger trg_on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();

-- Sync paid_amount on payments change
create or replace function sync_order_paid_amount()
returns trigger language plpgsql as $$
begin
  update orders
  set paid_amount = (
    select coalesce(sum(amount), 0) from payments
    where order_id = coalesce(new.order_id, old.order_id)
  )
  where id = coalesce(new.order_id, old.order_id);
  return null;
end;
$$;
create trigger trg_payments_sync_paid
  after insert or update or delete on payments
  for each row execute function sync_order_paid_amount();

-- ---------------------------------------------------------------------------
-- 6. Views
-- ---------------------------------------------------------------------------
create or replace view v_raw_fabric_inventory as
select fabric_type, color_name, color_code, quality_grade,
  count(*) as roll_count,
  coalesce(sum(length_m), 0) as total_length_m,
  coalesce(sum(weight_kg), 0) as total_weight_kg
from raw_fabric_rolls where status = 'in_stock'
group by fabric_type, color_name, color_code, quality_grade;

create or replace view v_finished_fabric_inventory as
select fabric_type, color_name, color_code, quality_grade,
  count(*) as roll_count,
  coalesce(sum(length_m), 0) as total_length_m,
  coalesce(sum(weight_kg), 0) as total_weight_kg
from finished_fabric_rolls where status = 'in_stock'
group by fabric_type, color_name, color_code, quality_grade;

create or replace view v_order_summary as
select o.id, o.order_number, c.name as customer_name,
  o.order_date, o.delivery_date, o.status,
  o.total_amount, o.paid_amount,
  (o.total_amount - o.paid_amount) as balance_due
from orders o join customers c on c.id = o.customer_id;

-- ---------------------------------------------------------------------------
-- 7. RLS
-- ---------------------------------------------------------------------------
alter table profiles               enable row level security;
alter table customers              enable row level security;
alter table suppliers              enable row level security;
alter table yarn_receipts          enable row level security;
alter table yarn_receipt_items     enable row level security;
alter table raw_fabric_rolls       enable row level security;
alter table finished_fabric_rolls  enable row level security;
alter table orders                 enable row level security;
alter table order_items            enable row level security;
alter table order_progress         enable row level security;
alter table shipments              enable row level security;
alter table shipment_items         enable row level security;
alter table payments               enable row level security;
alter table inventory_adjustments  enable row level security;
alter table settings               enable row level security;

create or replace function current_user_role()
returns user_role language sql security definer stable as $$
  select role from profiles where id = auth.uid()
$$;

-- Profiles policies
do $$ begin
  create policy "Users can view all profiles" on profiles for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can update own profile" on profiles for update to authenticated
    using (id = auth.uid()) with check (id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins can manage all profiles" on profiles for all to authenticated
    using (current_user_role() = 'admin');
exception when duplicate_object then null; end $$;

-- Business table policies
do $$ declare tbl text; begin
  foreach tbl in array array[
    'customers','suppliers',
    'yarn_receipts','yarn_receipt_items',
    'raw_fabric_rolls','finished_fabric_rolls',
    'orders','order_items','order_progress',
    'shipments','shipment_items',
    'payments','inventory_adjustments'
  ] loop
    begin
      execute format('create policy "Authenticated users can read %1$s" on %1$s for select to authenticated using (true);', tbl);
    exception when duplicate_object then null; end;
    begin
      execute format('create policy "Staff can insert %1$s" on %1$s for insert to authenticated with check (current_user_role() in (''admin'',''manager'',''staff''));', tbl);
    exception when duplicate_object then null; end;
    begin
      execute format('create policy "Staff can update %1$s" on %1$s for update to authenticated using (current_user_role() in (''admin'',''manager'',''staff''));', tbl);
    exception when duplicate_object then null; end;
    begin
      execute format('create policy "Managers can delete %1$s" on %1$s for delete to authenticated using (current_user_role() in (''admin'',''manager''));', tbl);
    exception when duplicate_object then null; end;
  end loop;
end $$;

do $$ begin
  create policy "Authenticated users can read settings" on settings for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins can manage settings" on settings for all to authenticated
    using (current_user_role() = 'admin');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 8. Seed settings (skip if key already exists)
-- ---------------------------------------------------------------------------
insert into settings (key, value, description) values
  ('company_name',          'VinhPhat', 'Tên công ty'),
  ('company_address',       '',         'Địa chỉ công ty'),
  ('company_phone',         '',         'Số điện thoại công ty'),
  ('company_tax_code',      '',         'Mã số thuế'),
  ('currency',              'VND',      'Đơn vị tiền tệ mặc định'),
  ('order_number_prefix',   'DH',       'Tiền tố số đơn hàng'),
  ('shipment_number_prefix','XH',       'Tiền tố số phiếu xuất hàng'),
  ('payment_number_prefix', 'TT',       'Tiền tố số phiếu thanh toán'),
  ('receipt_number_prefix', 'NS',       'Tiền tố số phiếu nhập sợi')
on conflict (key) do nothing;
