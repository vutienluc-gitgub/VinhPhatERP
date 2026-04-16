-- Migration: Link profiles to employees for driver portal
-- Them employee_id vao profiles de tai xe co the truy cap phieu xuat cua minh

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_employee ON public.profiles (employee_id);

COMMENT ON COLUMN public.profiles.employee_id IS
  'Lien ket voi bang employees - dung cho tai xe de lay danh sach phieu xuat duoc phan cong';
