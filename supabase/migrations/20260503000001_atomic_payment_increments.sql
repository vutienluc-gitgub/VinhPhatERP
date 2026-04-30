-- =============================================================================
-- Migration: Vá Sai Công Nợ (Atomic Increments for Paid Amount)
-- Fixes critical race conditions in updating paid_amount for invoices and orders.
-- =============================================================================

CREATE OR REPLACE FUNCTION rpc_increment_weaving_invoice_paid(
  p_id UUID,
  p_amount_to_add NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE weaving_invoices 
  SET paid_amount = paid_amount + p_amount_to_add,
      status = 'paid'
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION rpc_increment_weaving_invoice_paid(UUID, NUMERIC) TO authenticated;

CREATE OR REPLACE FUNCTION rpc_increment_dyeing_order_paid(
  p_id UUID,
  p_amount_to_add NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE dyeing_orders 
  SET paid_amount = paid_amount + p_amount_to_add
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION rpc_increment_dyeing_order_paid(UUID, NUMERIC) TO authenticated;
