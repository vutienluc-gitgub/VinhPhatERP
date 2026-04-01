-- =============================================================================
-- Migration 0002: Thêm trường weaving_partner_id vào raw_fabric_rolls
--                 Thêm giá trị 'weaving' vào enum supplier_category
-- =============================================================================

-- Thêm danh mục nhà dệt vào enum (idempotent với IF NOT EXISTS trên pg14+)
alter type supplier_category add value if not exists 'weaving';

-- Thêm cột nhà dệt gia công vào bảng cuộn vải mộc
alter table raw_fabric_rolls
  add column if not exists weaving_partner_id uuid references suppliers(id);

create index if not exists idx_raw_rolls_weaving_partner
  on raw_fabric_rolls (weaving_partner_id);
