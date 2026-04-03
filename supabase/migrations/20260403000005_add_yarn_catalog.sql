-- =============================================================================
-- Migration: Thêm bảng yarn_catalogs (danh mục loại sợi)
--            Thêm yarn_catalog_id vào yarn_receipt_items
-- =============================================================================
-- 1. Tạo bảng danh mục sợi
create table if not exists yarn_catalogs (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    name text not null,
    composition text,
    color_name text,
    tensile_strength text,
    origin text,
    unit text not null default 'kg',
    notes text,
    status active_status not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_yarn_catalogs_status on yarn_catalogs (status);
create index if not exists idx_yarn_catalogs_code on yarn_catalogs (code);
-- Trigger update updated_at
create trigger yarn_catalogs_updated_at before
update on yarn_catalogs for each row execute procedure set_updated_at();
-- 2. Thêm FK từ yarn_receipt_items sang yarn_catalogs (nullable — snapshot có thể khác catalog)
alter table yarn_receipt_items
add column if not exists yarn_catalog_id uuid references yarn_catalogs(id) on delete
set null;
create index if not exists idx_yri_catalog on yarn_receipt_items (yarn_catalog_id);
-- 3. RLS
alter table yarn_catalogs enable row level security;
create policy "yarn_catalogs_select" on yarn_catalogs for
select using (true);
create policy "yarn_catalogs_insert" on yarn_catalogs for
insert with check (auth.role() = 'authenticated');
create policy "yarn_catalogs_update" on yarn_catalogs for
update using (auth.role() = 'authenticated');
create policy "yarn_catalogs_delete" on yarn_catalogs for delete using (auth.role() = 'authenticated');