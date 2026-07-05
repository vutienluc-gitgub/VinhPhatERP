-- Migration: Tra cứu hóa đơn dệt gia công công khai
-- Thêm cột lookup_code, trigger tự sinh mã và hàm RPC tra cứu ẩn danh

-- 1. Hàm sinh mã ngẫu nhiên 10 ký tự (loại bỏ 0, 1, O, I để tránh nhầm lẫn)
CREATE OR REPLACE FUNCTION public.generate_lookup_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  result TEXT := '';
  i INT;
  char_len INT;
BEGIN
  char_len := length(chars);
  FOR i IN 1..10 LOOP
    result := result || substr(chars, floor(random() * char_len)::int + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. Hàm sinh mã duy nhất (đảm bảo không bị trùng lặp)
CREATE OR REPLACE FUNCTION public.generate_unique_weaving_invoice_lookup_code()
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := public.generate_lookup_code();
    SELECT EXISTS (
      SELECT 1 FROM public.weaving_invoices WHERE lookup_code = v_code
    ) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- 3. Thêm cột lookup_code vào weaving_invoices và tự động tạo mã cho các dòng hiện tại
ALTER TABLE public.weaving_invoices 
  ADD COLUMN IF NOT EXISTS lookup_code TEXT UNIQUE DEFAULT public.generate_unique_weaving_invoice_lookup_code();

-- Đảm bảo các dòng mới nếu không truyền vào cũng tự động được tạo mã
ALTER TABLE public.weaving_invoices 
  ALTER COLUMN lookup_code SET DEFAULT public.generate_unique_weaving_invoice_lookup_code();

-- Ràng buộc NOT NULL sau khi đã tạo mã cho tất cả các dòng hiện tại
ALTER TABLE public.weaving_invoices 
  ALTER COLUMN lookup_code SET NOT NULL;

-- 4. Tạo RPC function công khai để tra cứu hóa đơn dệt gia công qua lookup_code
CREATE OR REPLACE FUNCTION public.rpc_get_public_weaving_invoice(
  p_lookup_code TEXT
)
RETURNS TABLE (
  id                  UUID,
  invoice_number      TEXT,
  invoice_date        TEXT,
  fabric_type         TEXT,
  unit_price_per_kg   NUMERIC,
  total_weight_kg     NUMERIC,
  total_amount        NUMERIC,
  paid_amount         NUMERIC,
  status              TEXT,
  notes               TEXT,
  supplier_name       TEXT,
  supplier_code       TEXT,
  item_count          INT,
  items               JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice_id UUID;
BEGIN
  SELECT wi.id INTO v_invoice_id
  FROM public.weaving_invoices wi
  WHERE wi.lookup_code = p_lookup_code
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    wi.id,
    wi.invoice_number::TEXT,
    wi.invoice_date::TEXT,
    wi.fabric_type::TEXT,
    wi.unit_price_per_kg::NUMERIC,
    wi.total_weight_kg::NUMERIC,
    wi.total_amount::NUMERIC,
    wi.paid_amount::NUMERIC,
    wi.status::TEXT,
    wi.notes::TEXT,
    s.name::TEXT                                  AS supplier_name,
    s.code::TEXT                                  AS supplier_code,
    COUNT(wr.id)::INT                             AS item_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'roll_number',         wr.roll_number,
          'weight_kg',           wr.weight_kg,
          'length_m',            wr.length_m,
          'quality_grade',       wr.quality_grade,
          'warehouse_location',  wr.warehouse_location,
          'lot_number',          wr.lot_number,
          'notes',               wr.notes
        ) ORDER BY wr.sort_order
      ) FILTER (WHERE wr.id IS NOT NULL),
      '[]'::jsonb
    )                                             AS items
  FROM public.weaving_invoices wi
  LEFT JOIN public.suppliers s ON s.id = wi.supplier_id
  LEFT JOIN public.weaving_invoice_rolls wr ON wr.invoice_id = wi.id
  WHERE wi.lookup_code = p_lookup_code
  GROUP BY wi.id, wi.invoice_number, wi.invoice_date, wi.fabric_type,
           wi.unit_price_per_kg, wi.total_weight_kg, wi.total_amount,
           wi.paid_amount, wi.status, wi.notes, s.name, s.code;
END;
$$;

-- 5. Phân quyền thực thi RPC cho cả vai trò ẩn danh (anon) và người dùng đã xác thực (authenticated)
GRANT EXECUTE ON FUNCTION public.rpc_get_public_weaving_invoice(TEXT) TO anon, authenticated;
