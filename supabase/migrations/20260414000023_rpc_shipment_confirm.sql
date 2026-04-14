CREATE OR REPLACE FUNCTION atomic_confirm_shipment(
  p_shipment_id UUID
) RETURNS VOID AS $$
DECLARE
  v_roll_ids UUID[];
BEGIN
  -- Guard: only preparing can be confirmed
  IF NOT EXISTS (SELECT 1 FROM shipments WHERE id = p_shipment_id AND status = 'preparing') THEN
    RAISE EXCEPTION 'SHIPMENT_NOT_PREPARING: Cannot confirm a shipment that is not in preparing status';
  END IF;

  -- Collect roll IDs from items
  SELECT ARRAY_AGG(finished_roll_id)
  INTO v_roll_ids
  FROM shipment_items
  WHERE shipment_id = p_shipment_id AND finished_roll_id IS NOT NULL;

  -- Update shipment status
  UPDATE shipments
  SET status = 'shipped'::shipment_status,
      shipped_at = NOW()
  WHERE id = p_shipment_id;

  -- Update rolls to shipped
  IF v_roll_ids IS NOT NULL AND array_length(v_roll_ids, 1) > 0 THEN
    UPDATE finished_fabric_rolls
    SET status = 'shipped',
        reserved_for_order_id = NULL
    WHERE id = ANY(v_roll_ids);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
