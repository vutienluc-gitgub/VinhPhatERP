-- Add new columns to purchase_orders for public PO portal tracking
ALTER TABLE purchase_orders 
ADD COLUMN public_token UUID DEFAULT gen_random_uuid() UNIQUE,
ADD COLUMN confirmed_at TIMESTAMPTZ,
ADD COLUMN confirmation_method TEXT,
ADD COLUMN confirmed_ip TEXT,
ADD COLUMN confirmed_user_agent TEXT;

-- Generate new tokens for existing POs that might somehow have NULL
UPDATE purchase_orders SET public_token = gen_random_uuid() WHERE public_token IS NULL;

-- 1. RPC to get public PO details securely
CREATE OR REPLACE FUNCTION rpc_get_public_po_details(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_po RECORD;
  v_items JSONB;
BEGIN
  -- Validate and fetch PO header
  SELECT 
    id, tenant_id, po_code, order_date, supplier_name_snapshot, 
    total_amount, status, notes,
    confirmed_at, confirmation_method
  INTO v_po
  FROM purchase_orders
  WHERE public_token = p_token
  AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase Order not found or invalid token';
  END IF;

  -- Fetch PO items
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'material_name', material_name_snapshot,
      'uom', uom,
      'order_qty', order_qty,
      'unit_price', unit_price,
      'line_total', line_total,
      'notes', notes
    )
  ), '[]'::jsonb) INTO v_items
  FROM purchase_order_items
  WHERE purchase_order_id = v_po.id
  AND deleted_at IS NULL;

  -- Return combined result
  RETURN jsonb_build_object(
    'id', v_po.id,
    'tenant_id', v_po.tenant_id,
    'po_code', v_po.po_code,
    'order_date', v_po.order_date,
    'supplier_name', v_po.supplier_name_snapshot,
    'total_amount', v_po.total_amount,
    'status', v_po.status,
    'notes', v_po.notes,
    'confirmed_at', v_po.confirmed_at,
    'confirmation_method', v_po.confirmation_method,
    'items', v_items
  );
END;
$$;

-- 2. RPC to confirm public PO
CREATE OR REPLACE FUNCTION rpc_confirm_public_po(
  p_token UUID,
  p_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_po_id UUID;
  v_status purchase_order_status;
  v_tenant_id UUID;
BEGIN
  -- Get PO info and lock row
  SELECT id, status, tenant_id INTO v_po_id, v_status, v_tenant_id
  FROM purchase_orders
  WHERE public_token = p_token
  AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase Order not found or invalid token';
  END IF;

  IF v_status <> 'sent' THEN
    RAISE EXCEPTION 'This Purchase Order cannot be confirmed (current status: %)', v_status;
  END IF;

  -- Update PO
  UPDATE purchase_orders
  SET 
    status = 'supplier_confirmed',
    confirmed_at = NOW(),
    confirmation_method = 'portal',
    confirmed_ip = p_ip,
    confirmed_user_agent = p_user_agent,
    updated_at = NOW()
  WHERE id = v_po_id;

  -- Insert Audit Log
  INSERT INTO purchase_order_audit_logs (
    purchase_order_id,
    tenant_id,
    action,
    description,
    from_status,
    to_status
  ) VALUES (
    v_po_id,
    v_tenant_id,
    'SUPPLIER_CONFIRM',
    'Nhà cung cấp tự xác nhận Đơn đặt hàng qua Cổng thông tin (Portal)',
    v_status,
    'supplier_confirmed'
  );

  RETURN jsonb_build_object('success', true, 'po_id', v_po_id);
END;
$$;
