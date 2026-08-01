-- Fix rpc_create_goods_receipt: allow 'sent' and 'supplier_confirmed' statuses
-- Use public.current_tenant_id() to match existing convention

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
  
  -- Allow: approved, sent, supplier_confirmed, partial_received
  IF v_po_status NOT IN ('approved', 'sent', 'supplier_confirmed', 'partial_received') THEN
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
