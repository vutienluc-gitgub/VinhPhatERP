-- =====================================================================================
-- Migration: Fix Yarn Reservation Concurrency (Phantom Read)
-- =====================================================================================

-- Sửa đổi rpc_reserve_yarn để ép Transaction phải lấy Lock trên yarn_catalogs 
-- trước khi tính toán tồn kho, nhằm chống việc 2 Lệnh cùng over-reserve sợi
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

    -- THÊM LOCK Ở ĐÂY: Lấy row-level lock (FOR UPDATE) trên mặt hàng sợi này.
    -- Các Transaction khác gọi hàm này cùng lúc sẽ phải chờ dòng này nhả Lock.
    PERFORM 1 FROM yarn_catalogs WHERE id = v_yarn_id FOR UPDATE;

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
        'reason', format('Sợi "%s" chỉ còn %s kg khả dụng (cần %s kg)',
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
