CREATE OR REPLACE FUNCTION rpc_create_purchase_order(
  p_supplier_id UUID,
  p_supplier_name_snapshot VARCHAR,
  p_order_date DATE,
  p_expected_date DATE,
  p_total_amount DECIMAL,
  p_items JSONB,
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_po_id UUID;
  v_po_code TEXT;
  v_item JSONB;
  v_tenant_id UUID;
BEGIN
  v_tenant_id := (current_setting('app.current_tenant_id', true))::uuid;

  -- Generate PO Code
  v_po_code := next_po_code();

  -- Insert Purchase Order
  INSERT INTO purchase_orders (
    po_code, supplier_id, supplier_name_snapshot, order_date, expected_date,
    total_amount, status, created_by, tenant_id
  ) VALUES (
    v_po_code, p_supplier_id, p_supplier_name_snapshot, p_order_date, p_expected_date,
    p_total_amount, 'draft', p_created_by, v_tenant_id
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
