-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE purchase_order_status AS ENUM ('draft', 'approved', 'rejected', 'partial_received', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE uom_type AS ENUM ('kg', 'cây', 'mét', 'cuộn');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tables

-- Table: purchase_orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_code VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  supplier_name_snapshot VARCHAR(255) NOT NULL,
  status purchase_order_status DEFAULT 'draft',
  order_date DATE NOT NULL,
  expected_date DATE,
  total_amount DECIMAL(19,4) DEFAULT 0,
  rejection_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID NOT NULL DEFAULT (current_setting('app.current_tenant_id', true))::uuid
);

-- Table: purchase_order_items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  material_id UUID NOT NULL,
  uom uom_type NOT NULL,
  ordered_qty DECIMAL(15,4) NOT NULL CHECK (ordered_qty > 0),
  received_qty DECIMAL(15,4) DEFAULT 0 CHECK (received_qty >= 0),
  unit_price DECIMAL(19,4) NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID NOT NULL DEFAULT (current_setting('app.current_tenant_id', true))::uuid,
  CONSTRAINT check_received_qty_max CHECK (received_qty <= ordered_qty)
);

-- Table: goods_receipts
CREATE TABLE IF NOT EXISTS goods_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_code VARCHAR(50) UNIQUE NOT NULL,
  po_id UUID REFERENCES purchase_orders(id) NOT NULL,
  received_date DATE NOT NULL,
  client_request_id UUID UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID NOT NULL DEFAULT (current_setting('app.current_tenant_id', true))::uuid
);

-- Table: goods_receipt_items
CREATE TABLE IF NOT EXISTS goods_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID REFERENCES goods_receipts(id) ON DELETE CASCADE,
  po_item_id UUID REFERENCES purchase_order_items(id) NOT NULL,
  received_qty DECIMAL(15,4) NOT NULL CHECK (received_qty > 0),
  unit_price DECIMAL(19,4) NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID NOT NULL DEFAULT (current_setting('app.current_tenant_id', true))::uuid
);

-- Table: po_audit_logs
CREATE TABLE IF NOT EXISTS po_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  snapshot JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID NOT NULL DEFAULT (current_setting('app.current_tenant_id', true))::uuid
);

-- 3. Code Generators
CREATE OR REPLACE FUNCTION next_po_code()
RETURNS TEXT AS $$
DECLARE
  next_num TEXT;
  prefix TEXT;
BEGIN
  prefix := 'PO-' || to_char(CURRENT_DATE, 'YYYYMM') || '-';

  SELECT po_code INTO next_num
  FROM purchase_orders
  WHERE po_code LIKE prefix || '%'
  ORDER BY po_code DESC
  LIMIT 1;

  IF next_num IS NULL THEN
    RETURN prefix || '0001';
  ELSE
    RETURN prefix || lpad((substring(next_num FROM length(prefix) + 1)::INT + 1)::TEXT, 4, '0');
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION next_receipt_code()
RETURNS TEXT AS $$
DECLARE
  next_num TEXT;
  prefix TEXT;
BEGIN
  prefix := 'GR-' || to_char(CURRENT_DATE, 'YYYYMM') || '-';

  SELECT receipt_code INTO next_num
  FROM goods_receipts
  WHERE receipt_code LIKE prefix || '%'
  ORDER BY receipt_code DESC
  LIMIT 1;

  IF next_num IS NULL THEN
    RETURN prefix || '0001';
  ELSE
    RETURN prefix || lpad((substring(next_num FROM length(prefix) + 1)::INT + 1)::TEXT, 4, '0');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Triggers for updated_at
DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS update_po_items_updated_at ON purchase_order_items;
CREATE TRIGGER update_po_items_updated_at
  BEFORE UPDATE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. RLS Policies
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Tenant isolation for purchase_orders" ON purchase_orders;
    CREATE POLICY "Tenant isolation for purchase_orders" ON purchase_orders
      FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

    DROP POLICY IF EXISTS "Tenant isolation for purchase_order_items" ON purchase_order_items;
    CREATE POLICY "Tenant isolation for purchase_order_items" ON purchase_order_items
      FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

    DROP POLICY IF EXISTS "Tenant isolation for goods_receipts" ON goods_receipts;
    CREATE POLICY "Tenant isolation for goods_receipts" ON goods_receipts
      FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

    DROP POLICY IF EXISTS "Tenant isolation for goods_receipt_items" ON goods_receipt_items;
    CREATE POLICY "Tenant isolation for goods_receipt_items" ON goods_receipt_items
      FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

    DROP POLICY IF EXISTS "Tenant isolation for po_audit_logs" ON po_audit_logs;
    CREATE POLICY "Tenant isolation for po_audit_logs" ON po_audit_logs
      FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
END $$;

-- 6. Views

DROP VIEW IF EXISTS v_po_status;
CREATE VIEW v_po_status AS
SELECT 
  po_id,
  SUM(ordered_qty) as total_ordered_qty,
  SUM(received_qty) as total_received_qty,
  CASE 
    WHEN SUM(ordered_qty) = 0 THEN 0
    ELSE ROUND((SUM(received_qty) / SUM(ordered_qty) * 100), 2)
  END as progress_percentage
FROM purchase_order_items
GROUP BY po_id;

DROP VIEW IF EXISTS v_po_detail_full;
CREATE VIEW v_po_detail_full AS
SELECT 
  po.*,
  vps.total_ordered_qty,
  vps.total_received_qty,
  vps.progress_percentage
FROM purchase_orders po
LEFT JOIN v_po_status vps ON po.id = vps.po_id;

DROP VIEW IF EXISTS v_po_item_status;
CREATE VIEW v_po_item_status AS
SELECT 
  poi.*,
  (poi.ordered_qty - poi.received_qty) as remaining_qty
FROM purchase_order_items poi;

-- 7. RPC: rpc_create_goods_receipt
CREATE OR REPLACE FUNCTION rpc_create_goods_receipt(
  p_po_id UUID,
  p_client_request_id UUID,
  p_items JSONB,
  p_received_date DATE,
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_receipt_id UUID;
  v_receipt_code TEXT;
  v_item JSONB;
  v_po_item_id UUID;
  v_received_qty DECIMAL(15,4);
  v_remaining_qty DECIMAL(15,4);
  v_unit_price DECIMAL(19,4);
  v_total_ordered DECIMAL(15,4);
  v_total_received DECIMAL(15,4);
  v_po_status purchase_order_status;
  v_tenant_id UUID;
BEGIN
  v_tenant_id := (current_setting('app.current_tenant_id', true))::uuid;

  -- 1. Check Idempotency
  SELECT id INTO v_receipt_id FROM goods_receipts WHERE client_request_id = p_client_request_id;
  IF v_receipt_id IS NOT NULL THEN
    RETURN v_receipt_id;
  END IF;

  -- Verify PO
  SELECT status INTO v_po_status FROM purchase_orders WHERE id = p_po_id AND tenant_id = v_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase Order % not found', p_po_id;
  END IF;
  
  IF v_po_status NOT IN ('approved', 'partial_received') THEN
    RAISE EXCEPTION 'Cannot receive goods for PO in status: %', v_po_status;
  END IF;

  -- Generate receipt code
  v_receipt_code := next_receipt_code();

  -- 4. Create goods_receipt
  INSERT INTO goods_receipts (
    receipt_code, po_id, received_date, client_request_id, created_by, tenant_id
  ) VALUES (
    v_receipt_code, p_po_id, p_received_date, p_client_request_id, p_created_by, v_tenant_id
  ) RETURNING id INTO v_receipt_id;

  -- Loop through items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_po_item_id := (v_item->>'po_item_id')::UUID;
    v_received_qty := (v_item->>'received_qty')::DECIMAL;

    -- 2. Lock row
    SELECT (ordered_qty - received_qty), unit_price 
    INTO v_remaining_qty, v_unit_price
    FROM purchase_order_items 
    WHERE id = v_po_item_id AND po_id = p_po_id AND tenant_id = v_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PO Item % not found', v_po_item_id;
    END IF;

    -- 3. Check remaining qty
    IF v_received_qty > v_remaining_qty THEN
      RAISE EXCEPTION 'Received quantity % exceeds remaining quantity % for item %', v_received_qty, v_remaining_qty, v_po_item_id;
    END IF;

    -- 5. Insert goods_receipt_items
    INSERT INTO goods_receipt_items (
      receipt_id, po_item_id, received_qty, unit_price, tenant_id
    ) VALUES (
      v_receipt_id, v_po_item_id, v_received_qty, v_unit_price, v_tenant_id
    );

    -- 6. Update PO items
    UPDATE purchase_order_items 
    SET received_qty = received_qty + v_received_qty 
    WHERE id = v_po_item_id AND tenant_id = v_tenant_id;
  END LOOP;

  -- 7. Update PO Status
  SELECT SUM(ordered_qty), SUM(received_qty) 
  INTO v_total_ordered, v_total_received
  FROM purchase_order_items 
  WHERE po_id = p_po_id AND tenant_id = v_tenant_id;

  IF v_total_received >= v_total_ordered THEN
    v_po_status := 'completed';
  ELSE
    v_po_status := 'partial_received';
  END IF;

  UPDATE purchase_orders 
  SET status = v_po_status 
  WHERE id = p_po_id AND tenant_id = v_tenant_id;

  -- 8. Audit Log
  INSERT INTO po_audit_logs (
    entity_type, entity_id, action, actor_id, snapshot, tenant_id
  ) VALUES (
    'goods_receipt', v_receipt_id, 'receipt_created', p_created_by, jsonb_build_object('po_id', p_po_id, 'new_status', v_po_status), v_tenant_id
  );

  RETURN v_receipt_id;
END;
$$ LANGUAGE plpgsql;
