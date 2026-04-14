-- Migration: Configurable default user role
-- Updated At: 2026-04-14 07:00:00

-- 1. Insert seed data for default_user_role setting
INSERT INTO company_settings (key, value, description)
VALUES ('default_user_role', 'staff', 'Vai trò mặc định gán cho người dùng mới đăng ký')
ON CONFLICT (key) DO NOTHING;

-- 2. Update handle_new_user function to respect the setting
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger language plpgsql security definer AS $$
DECLARE
  v_default_role TEXT;
  v_role user_role;
BEGIN
  -- Lấy giá trị setting default_user_role
  SELECT value INTO v_default_role 
  FROM company_settings 
  WHERE key = 'default_user_role' 
  LIMIT 1;

  -- Ép kiểu về user_role, nếu lỗi hoặc null thì dùng 'staff'
  BEGIN
    v_role := v_default_role::user_role;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'staff'::user_role;
  END;

  IF v_role IS NULL THEN
    v_role := 'staff'::user_role;
  END IF;

  -- Tạo profile mới
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
    v_role
  );
  
  RETURN NEW;
END;
$$;
