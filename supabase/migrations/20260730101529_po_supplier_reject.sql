-- Add supplier_rejected to PO status enum
ALTER TYPE purchase_order_status ADD VALUE IF NOT EXISTS 'supplier_rejected';

-- Add supplier_rejection_reason column
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS supplier_rejection_reason TEXT;

-- RPC to reject/decline public PO by supplier
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
  AND deleted_at IS NULL
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
    'SUPPLIER_REJECT',
    'Nhà cung cấp từ chối Đơn đặt hàng qua Portal. Lý do: ' || trim(p_reason),
    v_status,
    'supplier_rejected'
  );

  RETURN jsonb_build_object('success', true, 'po_id', v_po_id);
END;
$$;
