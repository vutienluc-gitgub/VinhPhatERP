-- Create Supplier Notifications Table
CREATE TABLE IF NOT EXISTS supplier_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE supplier_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supplier can view own notifications" 
ON supplier_notifications FOR SELECT 
TO authenticated
USING (supplier_id = public.current_supplier_id());

CREATE POLICY "Supplier can update own notifications" 
ON supplier_notifications FOR UPDATE 
TO authenticated
USING (supplier_id = public.current_supplier_id());

-- Create Dashboard RPC
CREATE OR REPLACE FUNCTION rpc_get_supplier_dashboard(p_supplier_id UUID)
RETURNS JSON AS $$
DECLARE
  v_new_pos INT;
  v_new_rfqs INT;
  v_delivering INT;
  v_unpaid_debt NUMERIC;
  v_recent_pos JSON;
  v_recent_rfqs JSON;
BEGIN
  -- New POs
  SELECT COUNT(*) INTO v_new_pos 
  FROM purchase_orders 
  WHERE supplier_id = p_supplier_id AND status IN ('pending', 'approved', 'sent');

  -- Delivering
  SELECT COUNT(*) INTO v_delivering 
  FROM purchase_orders 
  WHERE supplier_id = p_supplier_id AND status = 'confirmed';

  -- Unpaid Debt
  SELECT balance_due INTO v_unpaid_debt 
  FROM v_supplier_debt 
  WHERE supplier_id = p_supplier_id;

  -- New RFQs (published)
  SELECT COUNT(*) INTO v_new_rfqs 
  FROM sourcing_rfqs 
  WHERE status = 'published';

  -- Recent POs
  SELECT json_agg(row_to_json(t)) INTO v_recent_pos
  FROM (
    SELECT id, po_code, status, order_date
    FROM purchase_orders
    WHERE supplier_id = p_supplier_id
    ORDER BY created_at DESC
    LIMIT 5
  ) t;

  -- Recent RFQs
  SELECT json_agg(row_to_json(t)) INTO v_recent_rfqs
  FROM (
    SELECT id, rfq_code, title, status, deadline_date
    FROM sourcing_rfqs
    WHERE status = 'published'
    ORDER BY created_at DESC
    LIMIT 5
  ) t;

  RETURN json_build_object(
    'metrics', json_build_object(
      'new_pos', COALESCE(v_new_pos, 0),
      'new_rfqs', COALESCE(v_new_rfqs, 0),
      'delivering', COALESCE(v_delivering, 0),
      'unpaid_debt', COALESCE(v_unpaid_debt, 0)
    ),
    'recent_pos', COALESCE(v_recent_pos, '[]'::json),
    'recent_rfqs', COALESCE(v_recent_rfqs, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
