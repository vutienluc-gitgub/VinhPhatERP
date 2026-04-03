-- ===========================================================================
-- Enhanced Shipments: shipping_rates, driver role, delivery tracking
-- ===========================================================================
-- ---------------------------------------------------------------------------
-- 1. Thêm role 'driver' vào enum user_role
-- ---------------------------------------------------------------------------
alter type user_role
add value if not exists 'driver' before 'viewer';
-- ---------------------------------------------------------------------------
-- 2. Bảng shipping_rates — Bảng giá cước vận chuyển
-- ---------------------------------------------------------------------------
create table if not exists shipping_rates (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    destination_area text not null,
    rate_per_trip numeric(14, 0),
    rate_per_meter numeric(14, 3),
    rate_per_kg numeric(14, 3),
    loading_fee numeric(14, 0) not null default 0,
    min_charge numeric(14, 0) not null default 0,
    is_active boolean not null default true,
    notes text,
    created_by uuid references profiles(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_shipping_rates_active on shipping_rates (is_active);
create index if not exists idx_shipping_rates_area on shipping_rates (destination_area);
create trigger trg_shipping_rates_updated_at before
update on shipping_rates for each row execute function set_updated_at();
-- ---------------------------------------------------------------------------
-- 3. Thêm cột mới vào bảng shipments
-- ---------------------------------------------------------------------------
alter table shipments
add column if not exists delivery_staff_id uuid references profiles(id),
    add column if not exists shipping_rate_id uuid references shipping_rates(id),
    add column if not exists shipping_cost numeric(14, 0) not null default 0,
    add column if not exists loading_fee numeric(14, 0) not null default 0,
    add column if not exists total_weight_kg numeric(14, 3),
    add column if not exists total_meters numeric(14, 3),
    add column if not exists vehicle_info text,
    add column if not exists prepared_at timestamptz,
    add column if not exists shipped_at timestamptz,
    add column if not exists delivered_at timestamptz,
    add column if not exists delivery_proof text,
    add column if not exists receiver_name text,
    add column if not exists receiver_phone text;
create index if not exists idx_shipments_delivery_staff on shipments (delivery_staff_id);
create index if not exists idx_shipments_shipping_rate on shipments (shipping_rate_id);
-- ---------------------------------------------------------------------------
-- 4. RLS cho shipping_rates
-- ---------------------------------------------------------------------------
alter table shipping_rates enable row level security;
-- Tất cả authenticated user đọc được bảng giá
create policy "Authenticated users can read shipping_rates" on shipping_rates for
select to authenticated using (true);
-- Chỉ admin quản lý bảng giá cước
create policy "Admins can manage shipping_rates" on shipping_rates for all to authenticated using (current_user_role() = 'admin');
-- ---------------------------------------------------------------------------
-- 5. Cập nhật RLS cho shipments — driver chỉ thấy phiếu mình
-- ---------------------------------------------------------------------------
-- Drop policy cũ cho shipments (select)
drop policy if exists "Authenticated users can read shipments" on shipments;
-- Policy mới: admin/manager/staff thấy tất cả, driver chỉ thấy phiếu được gán
create policy "Shipments read access" on shipments for
select to authenticated using (
        current_user_role() in ('admin', 'manager', 'staff')
        or (
            current_user_role() = 'driver'
            and delivery_staff_id = auth.uid()
        )
    );
-- Drop + recreate update policy cho shipments
drop policy if exists "Staff can update shipments" on shipments;
create policy "Shipments update access" on shipments for
update to authenticated using (
        current_user_role() in ('admin', 'manager', 'staff')
        or (
            current_user_role() = 'driver'
            and delivery_staff_id = auth.uid()
        )
    );
-- Driver cũng cần insert policy cho shipping upload
-- (giữ nguyên insert policy hiện tại — staff+ insert)
-- Driver không được insert shipment, chỉ update status + proof
-- ---------------------------------------------------------------------------
-- 6. RLS cho shipment_items — driver cũng cần đọc items
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated users can read shipment_items" on shipment_items;
create policy "Shipment items read access" on shipment_items for
select to authenticated using (
        current_user_role() in ('admin', 'manager', 'staff')
        or (
            current_user_role() = 'driver'
            and shipment_id in (
                select id
                from shipments
                where delivery_staff_id = auth.uid()
            )
        )
    );