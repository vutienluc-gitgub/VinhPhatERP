-- Thêm các trường nghiệp vụ mới vào bảng purchase_orders
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS supplier_ref VARCHAR(255),
  ADD COLUMN IF NOT EXISTS incoterms VARCHAR(50),
  ADD COLUMN IF NOT EXISTS payment_deadline DATE,
  ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS vat_terms VARCHAR(255);

-- Drop hàm cũ để tránh overload
DROP FUNCTION IF EXISTS rpc_create_purchase_order(
  p_supplier_id UUID,
  p_supplier_name_snapshot VARCHAR,
  p_order_date DATE,
  p_expected_date DATE,
  p_total_amount DECIMAL,
  p_items JSONB,
  p_created_by UUID,
  p_person_in_charge VARCHAR,
  p_payment_terms VARCHAR,
  p_currency VARCHAR,
  p_vat_rate DECIMAL,
  p_shipping_fee DECIMAL,
  p_delivery_warehouse VARCHAR,
  p_subtotal_amount DECIMAL,
  p_vat_amount DECIMAL
);

-- Cập nhật hàm rpc_create_purchase_order để hỗ trợ các tham số mới
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
  v_tenant_id := (current_setting('app.current_tenant_id', true))::uuid;

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
