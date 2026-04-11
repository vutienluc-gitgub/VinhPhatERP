-- Migration: Customer Portal
-- Thêm role 'customer' vào enum user_role và cột customer_id vào profiles
-- 1. Thêm 'customer' vào enum user_role
ALTER TYPE user_role
ADD VALUE IF NOT EXISTS 'customer';
-- 2. Thêm customer_id vào profiles để liên kết với bảng customers
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE
SET NULL;
-- 3. Unique constraint: mỗi customer chỉ có 1 portal account
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_customer_id_unique ON profiles (customer_id)
WHERE customer_id IS NOT NULL;