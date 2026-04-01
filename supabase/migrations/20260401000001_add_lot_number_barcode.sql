-- Add lot_number and barcode columns to raw_fabric_rolls
-- lot_number: nhóm các cuộn cùng lô sản xuất
-- barcode   : mã vạch duy nhất per cuộn, tự động sinh trên client
alter table raw_fabric_rolls
add column if not exists lot_number text,
    add column if not exists barcode text unique;
-- Index nhanh cho tìm kiếm theo lô
create index if not exists idx_raw_fabric_rolls_lot_number on raw_fabric_rolls (lot_number)
where lot_number is not null;