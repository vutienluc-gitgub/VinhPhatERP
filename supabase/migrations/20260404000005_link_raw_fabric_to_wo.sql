-- Migration: Link Raw Fabric Rolls to Work Orders
-- Integrate Raw Fabric with the Production flow (Phase 2).

ALTER TABLE public.raw_fabric_rolls 
ADD COLUMN IF NOT EXISTS work_order_id UUID REFERENCES public.work_orders(id);

CREATE INDEX IF NOT EXISTS idx_raw_fabric_rolls_wo ON public.raw_fabric_rolls(work_order_id);

COMMENT ON COLUMN public.raw_fabric_rolls.work_order_id IS 'Liên kết với lệnh sản xuất đã tạo ra cuộn vải mộc này.';
