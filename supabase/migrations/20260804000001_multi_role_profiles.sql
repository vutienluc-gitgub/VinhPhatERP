-- Migration: Multi-role profiles for Supplier Portal & unified auth

-- 1. Add supplier_id, employee_id and roles to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id),
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT '{}'::TEXT[];

-- 2. Create helper functions for RLS
CREATE OR REPLACE FUNCTION public.current_supplier_id() 
RETURNS UUID AS $$
  SELECT supplier_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_role(role_name TEXT) 
RETURNS BOOLEAN AS $$
  SELECT role_name = ANY(roles) FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
