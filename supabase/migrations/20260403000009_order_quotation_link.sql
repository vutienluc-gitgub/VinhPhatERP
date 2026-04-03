ALTER TABLE public.orders
ADD COLUMN source_quotation_id uuid REFERENCES public.quotations(id) ON DELETE SET NULL;

ALTER TABLE public.order_items
ADD COLUMN width_cm numeric(7,2);
