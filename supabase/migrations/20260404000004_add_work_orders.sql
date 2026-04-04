-- Migration: Work Orders (Lệnh sản xuất)
-- Tích hợp BOM vào quá trình lập lệnh sản xuất.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_order_status') THEN
        CREATE TYPE public.work_order_status AS ENUM ('draft', 'in_progress', 'completed', 'cancelled');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.work_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_number TEXT NOT NULL UNIQUE,
  order_id          UUID REFERENCES public.orders(id), -- Thể hiện LSX này cho đơn hàng nào (có thể null nếu sx dự trữ)
  bom_template_id   UUID NOT NULL REFERENCES public.bom_templates(id),
  bom_version       INT NOT NULL,                      -- Snapshot version của BOM lúc tạo lệnh
  target_quantity_m NUMERIC(14,3) NOT NULL CHECK (target_quantity_m > 0),
  target_weight_kg  NUMERIC(14,3) CHECK (target_weight_kg > 0),
  standard_loss_pct DECIMAL(5,2) NOT NULL DEFAULT 5,   -- Snapshot hao hụt từ BOM
  actual_yield_m    NUMERIC(14,3) DEFAULT 0,           -- Sản lượng mộc thực tế đạt được
  actual_loss_pct   DECIMAL(5,2),                      -- Hao hụt thực tế = (Yarn used - Actual yield weight) / Yarn used
  status            public.work_order_status NOT NULL DEFAULT 'draft',
  start_date        DATE,
  end_date          DATE,
  notes             TEXT,
  created_by        UUID REFERENCES public.profiles(id),
  updated_by        UUID REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_work_orders_number ON public.work_orders(work_order_number);
CREATE INDEX IF NOT EXISTS idx_work_orders_order ON public.work_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);

-- RLS
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép xem work_orders" ON public.work_orders FOR SELECT USING (true);
CREATE POLICY "Cho phép tạo/sửa work_orders" ON public.work_orders 
  FOR ALL USING (current_user_role() IN ('admin', 'manager', 'staff'));

-- Trigger auto update updated_at
CREATE TRIGGER trg_work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Chi tiết định mức nguyên liệu (Yarn Requirements) cho Work Order
CREATE TABLE IF NOT EXISTS public.work_order_y_requirements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id     UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  yarn_catalog_id   UUID NOT NULL REFERENCES public.yarn_catalogs(id),
  bom_ratio_pct     DECIMAL(5,2) NOT NULL,
  required_kg       NUMERIC(14,3) NOT NULL CHECK (required_kg > 0),
  allocated_kg      NUMERIC(14,3) NOT NULL DEFAULT 0, -- Sợi thực tế xuất kho cho lệnh này
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_wo_req_work_order ON public.work_order_y_requirements(work_order_id);

-- RLS
ALTER TABLE public.work_order_y_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép xem yarn requirements" ON public.work_order_y_requirements FOR SELECT USING (true);
CREATE POLICY "Cho phép quản lý yarn requirements" ON public.work_order_y_requirements 
  FOR ALL USING (current_user_role() IN ('admin', 'manager', 'staff'));

-- Trigger auto update updated_at
CREATE TRIGGER trg_wo_req_updated_at
  BEFORE UPDATE ON public.work_order_y_requirements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
