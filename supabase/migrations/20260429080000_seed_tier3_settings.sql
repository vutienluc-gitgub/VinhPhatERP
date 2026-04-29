-- ============================================================
-- Migration: Seed Tier 3 settings (Report, Integration, UI)
-- ============================================================

INSERT INTO company_settings (key, value, description, tenant_id)
SELECT key, value, description, (SELECT id FROM tenants WHERE slug = 'default' LIMIT 1)
FROM (VALUES
  -- Report
  ('timezone',           'Asia/Ho_Chi_Minh', 'Múi giờ'),
  ('fiscal_year_start',  '01/01',            'Ngày bắt đầu năm tài chính'),
  ('date_format',        'DD/MM/YYYY',       'Định dạng ngày hiển thị'),
  -- Integration
  ('webhook_url',        '',                 'Webhook URL nhận event'),
  ('smtp_host',          '',                 'SMTP Server'),
  ('smtp_port',          '587',              'SMTP Port'),
  ('smtp_from_email',    '',                 'Email gửi đi'),
  -- UI
  ('theme_mode',         'auto',             'Chế độ giao diện'),
  ('language',           'vi',               'Ngôn ngữ hiển thị'),
  ('print_logo_url',     '',                 'Logo cho hóa đơn in'),
  ('brand_color',        '#0B6BCB',          'Màu chủ đạo')
) AS seed(key, value, description)
ON CONFLICT (key) DO NOTHING;
