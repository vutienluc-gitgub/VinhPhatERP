-- Fix hallucinated columns and schema in Public PO Portal RPCs
-- 1. rpc_get_public_po_details
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
    total_amount, status,
    confirmed_at, confirmation_method
  INTO v_po
  FROM purchase_orders
  WHERE public_token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase Order not found or invalid token';
  END IF;

  -- Fetch PO items
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', poi.id,
      'material_name', COALESCE(yc.name, fc.name, 'Unknown Material'),
      'uom', poi.uom,
      'order_qty', poi.ordered_qty,
      'unit_price', poi.unit_price,
      'line_total', poi.ordered_qty * poi.unit_price,
      'notes', NULL
    )
  ), '[]'::jsonb) INTO v_items
  FROM purchase_order_items poi
  LEFT JOIN yarn_catalogs yc ON poi.material_id = yc.id
  LEFT JOIN fabric_catalogs fc ON poi.material_id = fc.id
  WHERE poi.po_id = v_po.id;

  -- Return combined result
  RETURN jsonb_build_object(
    'id', v_po.id,
    'tenant_id', v_po.tenant_id,
    'po_code', v_po.po_code,
    'order_date', v_po.order_date,
    'supplier_name', v_po.supplier_name_snapshot,
    'total_amount', v_po.total_amount,
    'status', v_po.status,
    'notes', NULL,
    'confirmed_at', v_po.confirmed_at,
    'confirmation_method', v_po.confirmation_method,
    'items', v_items
  );
END;
$$;

-- 2. rpc_confirm_public_po
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
  INSERT INTO po_audit_logs (
    entity_type,
    entity_id,
    action,
    snapshot,
    tenant_id
  ) VALUES (
    'purchase_order',
    v_po_id,
    'supplier_confirmed',
    jsonb_build_object(
      'description', 'Nhà cung cấp tự xác nhận Đơn đặt hàng qua Cổng thông tin (Portal)',
      'from_status', v_status,
      'to_status', 'supplier_confirmed'
    ),
    v_tenant_id
  );

  RETURN jsonb_build_object('success', true, 'po_id', v_po_id);
END;
$$;

-- 3. rpc_reject_public_po
CREATE OR REPLACE FUNCTION rpc_reject_public_po(
  p_token UUID,
  p_reason TEXT,
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
  -- Validate reason
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Vui lòng nhập lý do từ chối';
  END IF;

  -- Get PO info and lock row
  SELECT id, status, tenant_id INTO v_po_id, v_status, v_tenant_id
  FROM purchase_orders
  WHERE public_token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase Order not found or invalid token';
  END IF;

  -- Only allow rejection from 'sent' status
  IF v_status <> 'sent' THEN
    RAISE EXCEPTION 'This Purchase Order cannot be rejected (current status: %)', v_status;
  END IF;

  -- Update PO
  UPDATE purchase_orders
  SET 
    status = 'supplier_rejected',
    supplier_rejection_reason = trim(p_reason),
    confirmed_at = NOW(),
    confirmation_method = 'portal_rejected',
    confirmed_ip = p_ip,
    confirmed_user_agent = p_user_agent,
    updated_at = NOW()
  WHERE id = v_po_id;

  -- Insert Audit Log
  INSERT INTO po_audit_logs (
    entity_type,
    entity_id,
    action,
    snapshot,
    tenant_id
  ) VALUES (
    'purchase_order',
    v_po_id,
    'supplier_rejected',
    jsonb_build_object(
      'description', 'Nhà cung cấp từ chối Đơn đặt hàng qua Portal. Lý do: ' || trim(p_reason),
      'from_status', v_status,
      'to_status', 'supplier_rejected'
    ),
    v_tenant_id
  );

  RETURN jsonb_build_object('success', true, 'po_id', v_po_id);
END;
$$;
