-- ============================================================================
-- Migration: Trading Order Stock Management
-- ============================================================================
-- Mục đích:
--   1. Thêm cột product_category và source_stock_id vào order_items
--      để đơn thương mại (trading) có thể chỉ định nguồn hàng từ kho
--   2. Tạo bảng trading_stock_deductions để ghi nhận trừ kho
--   3. Tạo RPC rpc_confirm_trading_order để xác nhận đơn trading + trừ kho atomic
-- ============================================================================

-- ── 1. Mở rộng order_items ──────────────────────────────────────────────────

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_category TEXT NOT NULL DEFAULT 'fabric',
  ADD COLUMN IF NOT EXISTS source_stock_id UUID,
  ADD COLUMN IF NOT EXISTS source_lot_number TEXT;

COMMENT ON COLUMN order_items.product_category
  IS 'Loại sản phẩm: fabric (mặc định/production), yarn, raw_fabric, finished_fabric';
COMMENT ON COLUMN order_items.source_stock_id
  IS 'FK tới nguồn kho: yarn_catalogs.id (khi bán sợi)';
COMMENT ON COLUMN order_items.source_lot_number
  IS 'Số lô sợi (lot tracking khi bán sợi)';

-- ── 2. Bảng ghi nhận trừ kho thương mại ────────────────────────────────────

CREATE TABLE IF NOT EXISTS trading_stock_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  product_category TEXT NOT NULL,
  -- Cho sợi
  yarn_catalog_id UUID REFERENCES yarn_catalogs(id),
  lot_number TEXT,
  deducted_qty NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  -- Cho cuộn vải (mộc/thành phẩm)
  roll_id UUID,
  roll_type TEXT, -- 'raw' | 'finished'
  -- Metadata
  status TEXT NOT NULL DEFAULT 'deducted', -- 'deducted' | 'reversed'
  deducted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reversed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trading_stock_deductions_order
  ON trading_stock_deductions(order_id);
CREATE INDEX IF NOT EXISTS idx_trading_stock_deductions_yarn
  ON trading_stock_deductions(yarn_catalog_id)
  WHERE yarn_catalog_id IS NOT NULL;

-- Enable RLS
ALTER TABLE trading_stock_deductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY trading_stock_deductions_tenant_policy
  ON trading_stock_deductions
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

COMMENT ON TABLE trading_stock_deductions
  IS 'Ghi nhận trừ kho khi xác nhận đơn thương mại (trading). Hỗ trợ rollback khi hủy đơn.';

-- ── 3. RPC: Xác nhận đơn thương mại + trừ kho ──────────────────────────────

CREATE OR REPLACE FUNCTION rpc_confirm_trading_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_avail NUMERIC;
BEGIN
  -- 1. Lock & validate order
  SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Không tìm thấy đơn hàng';
  END IF;

  IF v_order.order_type != 'trading' THEN
    RAISE EXCEPTION 'NOT_TRADING: Đơn hàng không phải loại thương mại';
  END IF;

  IF v_order.status != 'draft' THEN
    RAISE EXCEPTION 'INVALID_STATUS: Chỉ xác nhận đơn ở trạng thái nháp';
  END IF;

  -- 2. Trừ kho cho từng dòng hàng
  FOR v_item IN
    SELECT * FROM order_items WHERE order_id = p_order_id
  LOOP
    -- 2a. Sợi: kiểm tra tồn kho rồi ghi deduction
    IF v_item.product_category = 'yarn' AND v_item.source_stock_id IS NOT NULL THEN
      SELECT available_qty INTO v_avail
        FROM v_yarn_availability
        WHERE id = v_item.source_stock_id;

      IF v_avail IS NULL OR v_avail < v_item.quantity THEN
        RAISE EXCEPTION 'INSUFFICIENT_YARN: Sợi % không đủ tồn kho. Cần: % kg, Khả dụng: % kg',
          v_item.fabric_type, v_item.quantity, COALESCE(v_avail, 0);
      END IF;

      INSERT INTO trading_stock_deductions
        (tenant_id, order_id, order_item_id, product_category, yarn_catalog_id,
         lot_number, deducted_qty, unit, status)
      VALUES
        (v_order.tenant_id, p_order_id, v_item.id, 'yarn', v_item.source_stock_id,
         v_item.source_lot_number, v_item.quantity, v_item.unit, 'deducted');

    -- 2b. Vải mộc: chuyển roll status → 'sold'
    ELSIF v_item.product_category = 'raw_fabric' AND v_item.source_stock_id IS NOT NULL THEN
      UPDATE raw_fabric_rolls
        SET status = 'sold', updated_at = NOW()
        WHERE id = v_item.source_stock_id
          AND status = 'in_stock';

      IF NOT FOUND THEN
        RAISE EXCEPTION 'ROLL_UNAVAILABLE: Cuộn vải mộc % không khả dụng', v_item.source_stock_id;
      END IF;

      INSERT INTO trading_stock_deductions
        (tenant_id, order_id, order_item_id, product_category, roll_id,
         roll_type, deducted_qty, unit, status)
      VALUES
        (v_order.tenant_id, p_order_id, v_item.id, 'raw_fabric', v_item.source_stock_id,
         'raw', v_item.quantity, v_item.unit, 'deducted');

    -- 2c. Vải thành phẩm: chuyển roll status → 'sold'
    ELSIF v_item.product_category = 'finished_fabric' AND v_item.source_stock_id IS NOT NULL THEN
      UPDATE finished_fabric_rolls
        SET status = 'sold', updated_at = NOW()
        WHERE id = v_item.source_stock_id
          AND status IN ('in_stock', 'reserved');

      IF NOT FOUND THEN
        RAISE EXCEPTION 'ROLL_UNAVAILABLE: Cuộn thành phẩm % không khả dụng', v_item.source_stock_id;
      END IF;

      INSERT INTO trading_stock_deductions
        (tenant_id, order_id, order_item_id, product_category, roll_id,
         roll_type, deducted_qty, unit, status)
      VALUES
        (v_order.tenant_id, p_order_id, v_item.id, 'finished_fabric', v_item.source_stock_id,
         'finished', v_item.quantity, v_item.unit, 'deducted');
    END IF;
  END LOOP;

  -- 3. Cập nhật trạng thái đơn
  UPDATE orders
    SET status = 'confirmed',
        updated_at = NOW()
    WHERE id = p_order_id;

  -- 4. Ghi audit log
  INSERT INTO business_audit_log
    (tenant_id, entity_type, entity_id, event_type, payload)
  VALUES
    (v_order.tenant_id, 'orders', p_order_id, 'TRADING_ORDER_CONFIRMED',
     jsonb_build_object(
       'order_number', v_order.order_number,
       'order_type', 'trading',
       'action', 'confirm_with_stock_deduction'
     ));
END;
$$;

COMMENT ON FUNCTION rpc_confirm_trading_order(UUID)
  IS 'Xac nhan don thuong mai: kiem tra ton kho -> tru kho atomic -> cap nhat trang thai.';

-- ── 4. RPC: Huy don thuong mai + hoan tra kho ──────────────────────────────

CREATE OR REPLACE FUNCTION rpc_cancel_trading_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_ded RECORD;
BEGIN
  -- 1. Lock & validate
  SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Khong tim thay don hang';
  END IF;

  IF v_order.order_type != 'trading' THEN
    RAISE EXCEPTION 'NOT_TRADING: Don hang khong phai loai thuong mai';
  END IF;

  IF v_order.status NOT IN ('draft', 'confirmed') THEN
    RAISE EXCEPTION 'INVALID_STATUS: Chi huy don o trang thai nhap hoac da xac nhan';
  END IF;

  -- 2. Reverse all active deductions
  FOR v_ded IN
    SELECT * FROM trading_stock_deductions
    WHERE order_id = p_order_id AND status = 'deducted'
    FOR UPDATE
  LOOP
    -- 2a. Yarn: deduction record reversed (v_yarn_availability auto-adjusts)
    -- No additional action needed — the deduction record itself affects the view

    -- 2b. Raw fabric: restore roll status
    IF v_ded.product_category = 'raw_fabric' AND v_ded.roll_id IS NOT NULL THEN
      UPDATE raw_fabric_rolls
        SET status = 'in_stock', updated_at = NOW()
        WHERE id = v_ded.roll_id
          AND status = 'sold';
    END IF;

    -- 2c. Finished fabric: restore roll status
    IF v_ded.product_category = 'finished_fabric' AND v_ded.roll_id IS NOT NULL THEN
      UPDATE finished_fabric_rolls
        SET status = 'in_stock', updated_at = NOW()
        WHERE id = v_ded.roll_id
          AND status = 'sold';
    END IF;

    -- Mark deduction as reversed
    UPDATE trading_stock_deductions
      SET status = 'reversed',
          reversed_at = NOW(),
          updated_at = NOW()
      WHERE id = v_ded.id;
  END LOOP;

  -- 3. Cancel order
  UPDATE orders
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = p_order_id;

  -- 4. Audit log
  INSERT INTO business_audit_log
    (tenant_id, entity_type, entity_id, event_type, payload)
  VALUES
    (v_order.tenant_id, 'orders', p_order_id, 'TRADING_ORDER_CANCELLED',
     jsonb_build_object(
       'order_number', v_order.order_number,
       'order_type', 'trading',
       'action', 'cancel_with_stock_reversal'
     ));
END;
$$;

COMMENT ON FUNCTION rpc_cancel_trading_order(UUID)
  IS 'Huy don thuong mai: reverse tru kho -> tra lai ton kho -> cap nhat trang thai cancelled.';
