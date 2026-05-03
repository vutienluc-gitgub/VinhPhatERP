-- Migration: add_yarn_receipt_item_specs
-- Description: Bổ sung các trường chuyên sâu cho sợi (dtex/f, twist, machine_no) vào bảng yarn_receipt_items. Trường grade đã có sẵn.

ALTER TABLE public.yarn_receipt_items
ADD COLUMN dtex VARCHAR(50) DEFAULT NULL,
ADD COLUMN twist VARCHAR(50) DEFAULT NULL,
ADD COLUMN machine_no VARCHAR(50) DEFAULT NULL;

-- Cập nhật hàm rpc_yarn_create.sql (nếu có) không cần thiết vì ta đang gọi rpc_create_yarn_receipt_atomic hoặc insert thẳng
-- Nhưng hãy kiểm tra lại có RPC nào cần update không. Hiện tại insert thông qua API có thể trực tiếp.
-- Chờ chút, nếu insert thẳng thông qua Supabase Client thì chỉ cần regenerate types.
