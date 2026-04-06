-- 20260406_create_colors_table.sql
-- Tạo bảng danh mục màu chuẩn hóa cho finished fabric
create table if not exists public.colors (
    code text primary key,
    name text not null,
    trend_year int,
    note text
);