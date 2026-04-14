-- Migration: Add employee_id to expenses table
-- Cho phep phieu chi lien ket voi nhan vien phu trach

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_employee ON public.expenses (employee_id);

COMMENT ON COLUMN public.expenses.employee_id IS 'Nhan vien phu trach phieu chi (tuy chon)';
