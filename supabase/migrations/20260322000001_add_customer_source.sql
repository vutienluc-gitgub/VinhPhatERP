-- =============================================================================
-- Migration 0003: Thêm trường source (nguồn khách hàng) vào bảng customers
-- =============================================================================

create type customer_source as enum (
  'referral',    -- Giới thiệu
  'exhibition',  -- Triển lãm/Hội chợ
  'zalo',        -- Zalo
  'online',      -- Online/Website
  'direct',      -- Trực tiếp
  'cold_call',   -- Telesales
  'other'        -- Khác
);

alter table customers
  add column if not exists source customer_source default 'other';
