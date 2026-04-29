-- ============================================================
-- Migration: Seed Tier 2 settings (Production, Shipment, User Management)
-- ============================================================

INSERT INTO company_settings (key, value, description, tenant_id)
SELECT key, value, description, (SELECT id FROM tenants WHERE slug = 'default' LIMIT 1)
FROM (VALUES
  -- Production & Warehouse
  ('default_unit',              'met',      'Đơn vị đo lường mặc định'),
  ('default_waste_rate',        '3',        'Tỷ lệ hao hụt mặc định (%)'),
  ('default_production_days',   '14',       'Số ngày sản xuất dự kiến'),
  -- Shipment
  ('default_shipping_unit',     'kg',       'Đơn vị cước vận chuyển'),
  ('default_shipping_region',   'Miền Nam', 'Khu vực giao hàng mặc định'),
  ('default_delivery_days',     '7',        'Thời gian giao hàng ước tính (ngày)'),
  -- User Management
  ('allow_self_signup',         'false',    'Cho phép tự đăng ký tài khoản'),
  ('require_account_approval',  'true',     'Yêu cầu phê duyệt tài khoản mới'),
  ('session_timeout_minutes',   '480',      'Thời gian hết phiên (phút)'),
  ('max_concurrent_devices',    '3',        'Số thiết bị đăng nhập đồng thời')
) AS seed(key, value, description)
ON CONFLICT (key) DO NOTHING;
