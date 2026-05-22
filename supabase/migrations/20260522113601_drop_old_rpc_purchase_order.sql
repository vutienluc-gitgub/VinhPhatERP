-- Drop hàm cũ để tránh overload
DROP FUNCTION IF EXISTS rpc_create_purchase_order(
  p_supplier_id UUID,
  p_supplier_name_snapshot VARCHAR,
  p_order_date DATE,
  p_expected_date DATE,
  p_total_amount DECIMAL,
  p_items JSONB,
  p_created_by UUID
);
