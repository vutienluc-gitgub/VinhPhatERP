-- Migration to link Goods Receipts (Procurement) with Yarn Receipts (Inventory)

ALTER TABLE public.goods_receipts
ADD COLUMN IF NOT EXISTS linked_yarn_receipt_id UUID;

ALTER TABLE public.yarn_receipts
ADD COLUMN IF NOT EXISTS source_goods_receipt_id UUID REFERENCES public.goods_receipts(id) ON DELETE SET NULL;
