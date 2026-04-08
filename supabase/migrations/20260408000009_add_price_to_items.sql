-- Migration: Add price fields to shipment items
-- Purpose: Store individual item pricing for debt calculation.

ALTER TABLE public.shipment_items
  ADD COLUMN IF NOT EXISTS price_per_meter NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(14,2) GENERATED ALWAYS AS (quantity * price_per_meter) STORED;

-- Add comment
COMMENT ON COLUMN public.shipment_items.price_per_meter IS 'Đơn giá bán trên mỗi mét vải.';
COMMENT ON COLUMN public.shipment_items.total_amount IS 'Thành tiền (tự động tính).';
