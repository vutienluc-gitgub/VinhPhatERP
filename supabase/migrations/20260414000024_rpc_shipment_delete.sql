CREATE OR REPLACE FUNCTION atomic_delete_shipment(
  p_shipment_id UUID
) RETURNS VOID AS $$
DECLARE
  v_roll_ids UUID[];
BEGIN
  -- Guard: only preparing can be deleted
  IF NOT EXISTS (SELECT 1 FROM shipments WHERE id = p_shipment_id AND status = 'preparing') THEN
    RAISE EXCEPTION 'SHIPMENT_NOT_PREPARING: Cannot delete a shipment that is not in preparing status';
  END IF;

  -- Collect roll IDs
  SELECT ARRAY_AGG(finished_roll_id)
  INTO v_roll_ids
  FROM shipment_items
  WHERE shipment_id = p_shipment_id AND finished_roll_id IS NOT NULL;

  -- Unreserve rolls
  IF v_roll_ids IS NOT NULL AND array_length(v_roll_ids, 1) > 0 THEN
    UPDATE finished_fabric_rolls
    SET status = 'in_stock',
        reserved_for_order_id = NULL
    WHERE id = ANY(v_roll_ids);
  END IF;

  -- Delete shipment (cascade will delete items)
  DELETE FROM shipments WHERE id = p_shipment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
