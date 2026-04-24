-- ============================================================
-- MIGRATION: Link Tasks to Orders & Work Orders
-- ============================================================

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id),
  ADD COLUMN IF NOT EXISTS work_order_id UUID REFERENCES public.work_orders(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_order_id ON public.tasks (order_id);
CREATE INDEX IF NOT EXISTS idx_tasks_work_order_id ON public.tasks (work_order_id);
