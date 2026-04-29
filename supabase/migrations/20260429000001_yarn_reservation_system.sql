-- ============================================================================
-- Migration: Yarn Reservation System (Soft-lock Inventory)
-- Mục đích: Cho phép giữ chỗ nguyên liệu khi Work Order chuyển sang yarn_issued,
--           tránh tình trạng 2 WO cùng đặt sợi nhưng kho không đủ.
-- ============================================================================

-- 1. Bảng yarn_reservations
CREATE TABLE IF NOT EXISTS yarn_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  yarn_catalog_id uuid NOT NULL REFERENCES yarn_catalogs(id),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  reserved_kg numeric NOT NULL DEFAULT 0 CHECK (reserved_kg >= 0),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'consumed', 'released')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  tenant_id uuid REFERENCES tenants(id)
);

-- Index cho tra cứu nhanh
CREATE INDEX IF NOT EXISTS idx_yarn_reservations_catalog
  ON yarn_reservations(yarn_catalog_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_yarn_reservations_wo
  ON yarn_reservations(work_order_id);

-- RLS
ALTER TABLE yarn_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_yarn_reservations" ON yarn_reservations
  USING (tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid);

-- 2. View: v_yarn_availability
-- Tổng hợp tồn kho thực tế (từ yarn_receipt_items confirmed) trừ đi reserved
CREATE OR REPLACE VIEW v_yarn_availability AS
SELECT
  yc.id,
  yc.code,
  yc.name,
  yc.color_name,
  yc.unit,
  COALESCE(stock.total_qty, 0) AS total_stock_qty,
  COALESCE(res.reserved_qty, 0) AS reserved_qty,
  COALESCE(stock.total_qty, 0) - COALESCE(res.reserved_qty, 0) AS available_qty
FROM yarn_catalogs yc
LEFT JOIN (
  SELECT
    yri.yarn_catalog_id,
    SUM(yri.quantity) AS total_qty
  FROM yarn_receipt_items yri
  INNER JOIN yarn_receipts yr ON yr.id = yri.receipt_id
  WHERE yr.status = 'confirmed'
    AND yri.yarn_catalog_id IS NOT NULL
  GROUP BY yri.yarn_catalog_id
) stock ON stock.yarn_catalog_id = yc.id
LEFT JOIN (
  SELECT
    yarn_catalog_id,
    SUM(reserved_kg) AS reserved_qty
  FROM yarn_reservations
  WHERE status = 'active'
  GROUP BY yarn_catalog_id
) res ON res.yarn_catalog_id = yc.id;

-- 3. RPC: rpc_reserve_yarn
-- Atomic reservation: kiểm tra available rồi mới insert
CREATE OR REPLACE FUNCTION rpc_reserve_yarn(
  p_work_order_id uuid,
  p_items jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item jsonb;
  v_yarn_id uuid;
  v_reserve_qty numeric;
  v_available numeric;
  v_yarn_name text;
  v_tenant_id uuid;
BEGIN
  -- Lấy tenant_id từ work_order
  SELECT tenant_id INTO v_tenant_id FROM work_orders WHERE id = p_work_order_id;

  -- Xóa reservations cũ của WO này (nếu retry)
  DELETE FROM yarn_reservations
  WHERE work_order_id = p_work_order_id AND status = 'active';

  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_yarn_id := (item->>'yarn_catalog_id')::uuid;
    v_reserve_qty := (item->>'reserved_kg')::numeric;

    -- Tính available (stock - active reservations của WO khác)
    SELECT
      COALESCE(stock.total_qty, 0) - COALESCE(res.reserved_qty, 0)
    INTO v_available
    FROM (SELECT 1) dummy
    LEFT JOIN (
      SELECT SUM(yri.quantity) AS total_qty
      FROM yarn_receipt_items yri
      INNER JOIN yarn_receipts yr ON yr.id = yri.receipt_id
      WHERE yr.status = 'confirmed'
        AND yri.yarn_catalog_id = v_yarn_id
    ) stock ON true
    LEFT JOIN (
      SELECT SUM(reserved_kg) AS reserved_qty
      FROM yarn_reservations
      WHERE yarn_catalog_id = v_yarn_id
        AND status = 'active'
    ) res ON true;

    IF v_available IS NULL THEN
      v_available := 0;
    END IF;

    IF v_available < v_reserve_qty THEN
      SELECT name INTO v_yarn_name FROM yarn_catalogs WHERE id = v_yarn_id;
      RETURN jsonb_build_object(
        'ok', false,
        'reason', format('Sợi "%s" chỉ còn %s khả dụng (cần %s)',
          COALESCE(v_yarn_name, v_yarn_id::text),
          round(v_available, 2),
          round(v_reserve_qty, 2)
        )
      );
    END IF;

    INSERT INTO yarn_reservations (yarn_catalog_id, work_order_id, reserved_kg, status, tenant_id)
    VALUES (v_yarn_id, p_work_order_id, v_reserve_qty, 'active', v_tenant_id);
  END LOOP;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- 4. RPC: rpc_release_yarn_reservation
-- Giải phóng reservation khi WO bị hủy
CREATE OR REPLACE FUNCTION rpc_release_yarn_reservation(
  p_work_order_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE yarn_reservations
  SET status = 'released', updated_at = now()
  WHERE work_order_id = p_work_order_id AND status = 'active';
END;
$$;

-- 5. RPC: rpc_consume_yarn_reservation
-- Chuyển reservation sang consumed khi WO hoàn thành
CREATE OR REPLACE FUNCTION rpc_consume_yarn_reservation(
  p_work_order_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE yarn_reservations
  SET status = 'consumed', updated_at = now()
  WHERE work_order_id = p_work_order_id AND status = 'active';
END;
$$;
