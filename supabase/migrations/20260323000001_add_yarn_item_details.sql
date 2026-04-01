-- Thêm các trường chi tiết kỹ thuật cho dòng sợi nhập kho
-- lot_number: số lô hàng từ nhà cung cấp (truy xuất nguồn gốc)
-- tensile_strength: cường lực sợi (đơn vị cN/tex hoặc g/d)
-- composition: thành phần sợi (VD: 100% Cotton, 65/35 PE/Co)
-- origin: xuất xứ sợi (VD: Việt Nam, Ấn Độ, Trung Quốc)

alter table yarn_receipt_items
  add column if not exists lot_number text,
  add column if not exists tensile_strength text,
  add column if not exists composition text,
  add column if not exists origin text;

comment on column yarn_receipt_items.lot_number is 'Số lô hàng từ nhà cung cấp';
comment on column yarn_receipt_items.tensile_strength is 'Cường lực sợi (cN/tex hoặc g/d)';
comment on column yarn_receipt_items.composition is 'Thành phần sợi (VD: 100% Cotton)';
comment on column yarn_receipt_items.origin is 'Xuất xứ sợi (VD: Việt Nam)';
