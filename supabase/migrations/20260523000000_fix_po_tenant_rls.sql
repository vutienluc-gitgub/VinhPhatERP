-- Fix: Use public.current_tenant_id() instead of current_setting('app.current_tenant_id')

-- 1. Fix DEFAULT values
ALTER TABLE purchase_orders ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE purchase_order_items ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE goods_receipts ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE goods_receipt_items ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE po_audit_logs ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();

-- 2. Fix RLS policies
DROP POLICY IF EXISTS "Tenant isolation for purchase_orders" ON purchase_orders;
CREATE POLICY "Tenant isolation for purchase_orders" ON purchase_orders
  FOR ALL USING (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for purchase_order_items" ON purchase_order_items;
CREATE POLICY "Tenant isolation for purchase_order_items" ON purchase_order_items
  FOR ALL USING (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for goods_receipts" ON goods_receipts;
CREATE POLICY "Tenant isolation for goods_receipts" ON goods_receipts
  FOR ALL USING (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for goods_receipt_items" ON goods_receipt_items;
CREATE POLICY "Tenant isolation for goods_receipt_items" ON goods_receipt_items
  FOR ALL USING (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for po_audit_logs" ON po_audit_logs;
CREATE POLICY "Tenant isolation for po_audit_logs" ON po_audit_logs
  FOR ALL USING (tenant_id = public.current_tenant_id());


-- 3. Fix RPCs
CREATE OR REPLACE FUNCTION rpc_create_purchase_order(
  p_supplier_id UUID,
  p_supplier_name_snapshot VARCHAR,
  p_order_date DATE,
  p_expected_date DATE,
  p_total_amount DECIMAL,
  p_items JSONB,
  p_created_by UUID,
  p_person_in_charge VARCHAR DEFAULT NULL,
  p_payment_terms VARCHAR DEFAULT NULL,
  p_currency VARCHAR DEFAULT 'VND',
  p_vat_rate DECIMAL DEFAULT 0,
  p_shipping_fee DECIMAL DEFAULT 0,
  p_delivery_warehouse VARCHAR DEFAULT NULL,
  p_subtotal_amount DECIMAL DEFAULT 0,
  p_vat_amount DECIMAL DEFAULT 0,
  p_supplier_ref VARCHAR DEFAULT NULL,
  p_incoterms VARCHAR DEFAULT NULL,
  p_payment_deadline DATE DEFAULT NULL,
  p_priority VARCHAR DEFAULT 'normal',
  p_attachments JSONB DEFAULT '[]'::jsonb,
  p_vat_terms VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_po_id UUID;
  v_po_code TEXT;
  v_item JSONB;
  v_tenant_id UUID;
BEGIN
  v_tenant_id := public.current_tenant_id();

  -- Generate PO Code
  v_po_code := next_po_code();

  -- Insert Purchase Order
  INSERT INTO purchase_orders (
    po_code, supplier_id, supplier_name_snapshot, order_date, expected_date,
    total_amount, status, created_by, tenant_id,
    person_in_charge, payment_terms, currency, vat_rate,
    shipping_fee, delivery_warehouse, subtotal_amount, vat_amount,
    supplier_ref, incoterms, payment_deadline, priority, attachments, vat_terms
  ) VALUES (
    v_po_code, p_supplier_id, p_supplier_name_snapshot, p_order_date, p_expected_date,
    p_total_amount, 'draft', p_created_by, v_tenant_id,
    p_person_in_charge, p_payment_terms, p_currency, p_vat_rate,
    p_shipping_fee, p_delivery_warehouse, p_subtotal_amount, p_vat_amount,
    p_supplier_ref, p_incoterms, p_payment_deadline, p_priority, p_attachments, p_vat_terms
  ) RETURNING id INTO v_po_id;

  -- Insert Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO purchase_order_items (
      po_id, material_id, uom, ordered_qty, unit_price, tenant_id
    ) VALUES (
      v_po_id,
      (v_item->>'material_id')::UUID,
      (v_item->>'uom')::uom_type,
      (v_item->>'ordered_qty')::DECIMAL,
      (v_item->>'unit_price')::DECIMAL,
      v_tenant_id
    );
  END LOOP;

  -- Audit Log
  INSERT INTO po_audit_logs (
    entity_type, entity_id, action, actor_id, snapshot, tenant_id
  ) VALUES (
    'purchase_order', v_po_id, 'created', p_created_by, 
    jsonb_build_object('po_code', v_po_code, 'supplier_id', p_supplier_id), 
    v_tenant_id
  );

  RETURN v_po_id;
END;
$$ LANGUAGE plpgsql;


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
  v_tenant_id := public.current_tenant_id();

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
