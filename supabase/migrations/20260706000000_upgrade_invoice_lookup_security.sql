-- Migration: Nâng cấp bảo mật tra cứu hóa đơn dệt gia công
-- Thêm cờ công khai, thời gian hết hạn hiệu lực, bảng audit logs và ghi nhận log trong RPC

-- 1. Thêm cột cấu hình quyền công khai vào bảng weaving_invoices
ALTER TABLE public.weaving_invoices
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS public_until TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.weaving_invoices.is_public IS 'Cho phép tra cứu công khai không cần đăng nhập';
COMMENT ON COLUMN public.weaving_invoices.public_until IS 'Thời hạn kết thúc hiệu lực tra cứu công khai';

-- 2. Tạo bảng nhật ký tra cứu ẩn danh (Audit Logs)
CREATE TABLE IF NOT EXISTS public.weaving_invoice_lookup_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lookup_code TEXT NOT NULL,
  success     BOOLEAN NOT NULL,
  ip_hash     TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kích hoạt RLS cho bảng nhật ký để tránh truy cập trái phép
ALTER TABLE public.weaving_invoice_lookup_logs ENABLE ROW LEVEL SECURITY;

-- 3. Cập nhật RPC function rpc_get_public_weaving_invoice
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
  v_is_public BOOLEAN;
  v_public_until TIMESTAMPTZ;
  v_ip TEXT;
  v_ip_hash TEXT;
  v_ua TEXT;
  v_success BOOLEAN := false;
BEGIN
  -- Lấy IP và User-Agent từ PostgREST request headers an toàn
  BEGIN
    v_ip := current_setting('request.headers', true)::jsonb->>'x-forwarded-for';
    v_ua := current_setting('request.headers', true)::jsonb->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    v_ip := 'unknown';
    v_ua := 'unknown';
  END;

  IF v_ip IS NULL THEN
    v_ip := 'unknown';
  END IF;
  v_ip_hash := md5(v_ip);

  -- Truy vấn thông tin cơ bản để kiểm tra trạng thái công khai
  SELECT wi.id, wi.is_public, wi.public_until 
  INTO v_invoice_id, v_is_public, v_public_until
  FROM public.weaving_invoices wi
  WHERE wi.lookup_code = p_lookup_code
  LIMIT 1;

  IF FOUND AND v_is_public AND (v_public_until IS NULL OR v_public_until > now()) THEN
    v_success := true;
  END IF;

  -- Ghi nhận audit log lượt tra cứu ẩn danh
  INSERT INTO public.weaving_invoice_lookup_logs (
    lookup_code, success, ip_hash, user_agent
  ) VALUES (
    p_lookup_code, v_success, v_ip_hash, v_ua
  );

  -- Trả về dữ liệu nếu kiểm tra thành công
  IF v_success THEN
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
    WHERE wi.id = v_invoice_id
    GROUP BY wi.id, wi.invoice_number, wi.invoice_date, wi.fabric_type,
             wi.unit_price_per_kg, wi.total_weight_kg, wi.total_amount,
             wi.paid_amount, wi.status, wi.notes, s.name, s.code;
  ELSE
    RETURN;
  END IF;
END;
$$;

-- 4. Phân quyền thực thi RPC cho role anon và authenticated
GRANT EXECUTE ON FUNCTION public.rpc_get_public_weaving_invoice(TEXT) TO anon, authenticated;
