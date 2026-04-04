-- =============================================================================
-- Migration: ERP createOrder support fields
-- 1. credit_status enum + credit fields on customers
-- 2. order_lot_allocations table (FIFO reservation tracking)
-- 3. business_audit_log table (immutable event log)
-- 4. source_quotation_id on orders (if not added yet)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. credit_status enum
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_status') THEN
    CREATE TYPE credit_status AS ENUM ('active', 'on_hold', 'blocked');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Credit / debt fields on customers
--    credit_limit    : hạn mức tín dụng tối đa (VND)
--    current_debt    : tổng công nợ hiện tại (pending + chính thức, chưa quá hạn)
--    overdue_debt    : phần công nợ đã quá hạn due_date
--    credit_status   : active / on_hold / blocked
--    payment_terms   : COD | PREPAY | NET7 | NET15 | NET30 | 50_50
-- ---------------------------------------------------------------------------
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS credit_limit   NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_debt   NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overdue_debt   NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_status  credit_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS payment_terms  TEXT NOT NULL DEFAULT 'NET30'
    CHECK (payment_terms IN ('COD','PREPAY','NET7','NET15','NET30','50_50'));

CREATE INDEX IF NOT EXISTS idx_customers_credit_status ON customers (credit_status);

-- ---------------------------------------------------------------------------
-- 3. order_lot_allocations — FIFO allocation record per order line
--    Khi đơn CONFIRMED: system ghi lại lô nào được phân bổ bao nhiêu mét.
--    Khi đơn CANCELLED / SHIPPED: dùng bảng này để release hoặc deduct tồn.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_lot_allocations (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id    UUID          REFERENCES order_items(id) ON DELETE CASCADE,
  -- Lô thành phẩm được phân bổ (roll-based, theo finished_fabric_rolls)
  roll_id          UUID          NOT NULL REFERENCES finished_fabric_rolls(id),
  allocated_meters NUMERIC(14,3) NOT NULL CHECK (allocated_meters > 0),
  reserved_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  released_at      TIMESTAMPTZ,                          -- set khi cancel/ship
  release_reason   TEXT,                                 -- 'cancelled' | 'shipped'
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ola_order    ON order_lot_allocations (order_id);
CREATE INDEX IF NOT EXISTS idx_ola_roll     ON order_lot_allocations (roll_id);
CREATE INDEX IF NOT EXISTS idx_ola_released ON order_lot_allocations (released_at)
  WHERE released_at IS NULL;

ALTER TABLE order_lot_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ola_select" ON order_lot_allocations
  FOR SELECT USING (true);

CREATE POLICY "ola_insert" ON order_lot_allocations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role::text IN ('admin','manager','staff','sale')
        AND is_active = true
    )
  );

CREATE POLICY "ola_update" ON order_lot_allocations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role::text IN ('admin','manager')
        AND is_active = true
    )
  );

-- ---------------------------------------------------------------------------
-- 4. business_audit_log — immutable event log (INSERT only, no UPDATE/DELETE)
--    Ghi lại mọi sự kiện nghiệp vụ quan trọng cho traceability.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_audit_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   TEXT        NOT NULL,   -- 'ORDER_CREATED', 'ORDER_CONFIRMED', etc.
  entity_type  TEXT        NOT NULL,   -- 'order', 'customer', 'payment', etc.
  entity_id    UUID        NOT NULL,
  user_id      UUID        REFERENCES profiles(id),
  payload      JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bal_entity   ON business_audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_bal_event    ON business_audit_log (event_type);
CREATE INDEX IF NOT EXISTS idx_bal_user     ON business_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_bal_created  ON business_audit_log (created_at DESC);

ALTER TABLE business_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bal_select" ON business_audit_log
  FOR SELECT USING (true);

CREATE POLICY "bal_insert" ON business_audit_log
  FOR INSERT WITH CHECK (true); -- Service role inserts from Edge Function

-- ---------------------------------------------------------------------------
-- 5. source_quotation_id on orders (idempotent — may already exist)
-- ---------------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source_quotation_id UUID REFERENCES quotations(id);

CREATE INDEX IF NOT EXISTS idx_orders_quotation ON orders (source_quotation_id)
  WHERE source_quotation_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 6. Helper function: release lot allocations (used by cancel & ship triggers)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION release_order_allocations(
  p_order_id     UUID,
  p_reason       TEXT  -- 'cancelled' | 'shipped'
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Mark allocations as released
  UPDATE order_lot_allocations
  SET released_at   = NOW(),
      release_reason = p_reason
  WHERE order_id   = p_order_id
    AND released_at IS NULL;

  -- If cancelled: return rolls to in_stock
  IF p_reason = 'cancelled' THEN
    UPDATE finished_fabric_rolls
    SET status                 = 'in_stock',
        reserved_for_order_id  = NULL
    WHERE reserved_for_order_id = p_order_id
      AND status = 'reserved';

    -- Reverse pending debt adjustment on customer
    UPDATE customers c
    SET current_debt = GREATEST(0, c.current_debt - o.total_amount)
    FROM orders o
    WHERE o.id = p_order_id
      AND c.id = o.customer_id;

  -- If shipped: rolls stay 'shipped', debt becomes official (no amount change)
  ELSIF p_reason = 'shipped' THEN
    UPDATE finished_fabric_rolls
    SET status = 'shipped'
    WHERE reserved_for_order_id = p_order_id
      AND status = 'reserved';
  END IF;
END;
$$;
