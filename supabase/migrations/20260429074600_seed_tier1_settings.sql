-- ============================================================
-- Migration: Seed Tier 1 settings (Finance, Numbering, Notification)
-- ============================================================

INSERT INTO company_settings (key, value, description, tenant_id)
SELECT key, value, description, (SELECT id FROM tenants WHERE slug = 'default' LIMIT 1)
FROM (VALUES
  -- Finance
  ('default_currency',       'VND',      'Đơn vị tiền tệ mặc định'),
  ('default_vat_rate',       '10',       'Thuế VAT mặc định (%)'),
  ('default_payment_terms',  '30',       'Hạn thanh toán mặc định (ngày)'),
  ('default_credit_limit',   '50000000', 'Hạn mức tín dụng mặc định (VNĐ)'),
  -- Numbering
  ('order_prefix',           'ĐH-',     'Prefix đơn hàng'),
  ('quotation_prefix',       'BG-',     'Prefix báo giá'),
  ('invoice_prefix',         'HĐ-',     'Prefix hóa đơn'),
  ('payment_prefix',         'PT-',     'Prefix phiếu thu'),
  ('expense_prefix',         'PC-',     'Prefix phiếu chi'),
  ('numbering_reset_yearly', 'true',    'Reset số thứ tự theo năm'),
  -- Notification
  ('notify_new_order',       'true',    'Thông báo đơn hàng mới'),
  ('notify_payment_overdue', 'true',    'Cảnh báo thanh toán quá hạn'),
  ('notify_low_stock',       'false',   'Cảnh báo tồn kho thấp'),
  ('low_stock_threshold',    '100',     'Ngưỡng tồn kho tối thiểu (kg)'),
  ('notification_email',     '',        'Email nhận thông báo')
) AS seed(key, value, description)
ON CONFLICT (key) DO NOTHING;
