-- ===========================================================================
-- Fix: RLS policies thiếu INSERT/UPDATE/DELETE trên tất cả business tables
-- Fix: profiles bị disable RLS
-- Fix: backfill profiles cho auth users thiếu
-- ===========================================================================
-- ---------------------------------------------------------------------------
-- 1. Bật lại RLS trên profiles (đang bị disable)
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
-- ---------------------------------------------------------------------------
-- 2. Backfill profiles cho auth users chưa có
-- ---------------------------------------------------------------------------
insert into profiles (id, full_name, role)
select u.id,
    coalesce(u.raw_user_meta_data->>'full_name', ''),
    'staff'::user_role
from auth.users u
    left join profiles p on p.id = u.id
where p.id is null;
-- ---------------------------------------------------------------------------
-- 3. Đảm bảo function current_user_role() tồn tại
-- ---------------------------------------------------------------------------
create or replace function current_user_role() returns user_role language sql security definer stable as $$
select role
from profiles
where id = auth.uid() $$;
-- ---------------------------------------------------------------------------
-- 4. Drop + recreate ALL business table policies (fix thiếu INSERT/UPDATE/DELETE)
-- ---------------------------------------------------------------------------
do $$
declare tbl text;
begin foreach tbl in array array [
    'customers','suppliers',
    'yarn_receipts','yarn_receipt_items',
    'raw_fabric_rolls','finished_fabric_rolls',
    'orders','order_items','order_progress',
    'shipments','shipment_items',
    'payments','inventory_adjustments'
  ] loop -- Drop tất cả policies cũ
execute format(
    'drop policy if exists "Authenticated users can read %1$s" on %1$s;',
    tbl
);
execute format(
    'drop policy if exists "Staff can insert %1$s" on %1$s;',
    tbl
);
execute format(
    'drop policy if exists "Staff can update %1$s" on %1$s;',
    tbl
);
execute format(
    'drop policy if exists "Managers can delete %1$s" on %1$s;',
    tbl
);
-- Đảm bảo RLS enabled
execute format(
    'alter table %1$s enable row level security;',
    tbl
);
-- Tạo lại 4 policies
execute format(
    'create policy "Authenticated users can read %1$s" on %1$s for select to authenticated using (true);',
    tbl
);
execute format(
    'create policy "Staff can insert %1$s" on %1$s for insert to authenticated with check (current_user_role() in (''admin'',''manager'',''staff''));',
    tbl
);
execute format(
    'create policy "Staff can update %1$s" on %1$s for update to authenticated using (current_user_role() in (''admin'',''manager'',''staff''));',
    tbl
);
execute format(
    'create policy "Managers can delete %1$s" on %1$s for delete to authenticated using (current_user_role() in (''admin'',''manager''));',
    tbl
);
end loop;
end $$;
-- ---------------------------------------------------------------------------
-- 5. Profiles policies (drop + recreate)
-- ---------------------------------------------------------------------------
drop policy if exists "Users can view all profiles" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Admins can manage all profiles" on profiles;
create policy "Users can view all profiles" on profiles for
select to authenticated using (true);
create policy "Users can update own profile" on profiles for
update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "Admins can manage all profiles" on profiles for all to authenticated using (current_user_role() = 'admin');
-- ---------------------------------------------------------------------------
-- 6. Fix trigger handle_new_user (thêm ON CONFLICT)
-- ---------------------------------------------------------------------------
create or replace function handle_new_user() returns trigger language plpgsql security definer as $$ begin
insert into profiles (id, full_name)
values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', '')
    ) on conflict (id) do nothing;
return new;
end;
$$;