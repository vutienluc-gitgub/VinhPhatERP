-- ============================================================
-- Migration: company_settings table
-- ============================================================

CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'company_settings'
      AND policyname = 'Anyone can read company_settings'
  ) THEN
    CREATE POLICY "Anyone can read company_settings"
      ON company_settings FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'company_settings'
      AND policyname = 'Admin can manage company_settings'
  ) THEN
    CREATE POLICY "Admin can manage company_settings"
      ON company_settings FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

INSERT INTO company_settings (key, value, description) VALUES
  ('company_name',  'Công Ty TNHH Dệt May Vĩnh Phát', 'Tên công ty'),
  ('address',       '123 Đường Vĩnh Phát, Quận Tân Bình, TP.HCM', 'Địa chỉ'),
  ('tax_code',      '0312012012', 'Mã số thuế'),
  ('phone',         '0909 123 456', 'Số điện thoại'),
  ('email',         '', 'Email công ty'),
  ('website',       '', 'Website'),
  ('bank_account',  '', 'Số tài khoản ngân hàng'),
  ('bank_name',     '', 'Tên ngân hàng'),
  ('logo_url',      '', 'Link logo công ty')
ON CONFLICT (key) DO NOTHING;
