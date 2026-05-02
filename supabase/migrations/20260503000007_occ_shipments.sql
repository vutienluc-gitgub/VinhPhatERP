-- Migration: Add OCC to Shipments

-- 1. rpc_confirm_shipment
DROP FUNCTION IF EXISTS public.rpc_confirm_shipment(UUID);
DROP FUNCTION IF EXISTS public.rpc_confirm_shipment(UUID, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION rpc_confirm_shipment(
  p_shipment_id UUID,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_roll_ids UUID[];
  v_current_updated_at TIMESTAMPTZ;
BEGIN
  -- OCC Guard
  IF p_expected_updated_at IS NOT NULL THEN
    SELECT updated_at INTO v_current_updated_at
    FROM shipments WHERE id = p_shipment_id FOR UPDATE;

    IF date_trunc('milliseconds', v_current_updated_at) != date_trunc('milliseconds', p_expected_updated_at) THEN
      RAISE EXCEPTION 'OCC_MISMATCH: Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.';
    END IF;
  END IF;

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
      shipped_at = NOW(),
      updated_at = NOW()
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


-- 2. rpc_update_shipment_journey
DROP FUNCTION IF EXISTS public.rpc_update_shipment_journey(UUID, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.rpc_update_shipment_journey(UUID, TEXT, TEXT, UUID, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION rpc_update_shipment_journey(
  p_shipment_id    UUID,
  p_journey_status TEXT,
  p_notes          TEXT DEFAULT NULL,
  p_updated_by     UUID DEFAULT NULL,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status TEXT;
  v_journey_status TEXT;
  v_current_updated_at TIMESTAMPTZ;
BEGIN
  SELECT status, journey_status, updated_at
    INTO v_current_status, v_journey_status, v_current_updated_at
    FROM public.shipments
   WHERE id = p_shipment_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SHIPMENT_NOT_FOUND';
  END IF;

  -- OCC Guard
  IF p_expected_updated_at IS NOT NULL THEN
    IF date_trunc('milliseconds', v_current_updated_at) != date_trunc('milliseconds', p_expected_updated_at) THEN
      RAISE EXCEPTION 'OCC_MISMATCH: Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.';
    END IF;
  END IF;

  IF v_current_status NOT IN ('shipped') THEN
    RAISE EXCEPTION 'SHIPMENT_NOT_IN_TRANSIT: Phieu xuat phai o trang thai "Dang giao" moi cap nhat hanh trinh';
  END IF;

  -- Update journey_status on main shipments table
  UPDATE public.shipments
     SET journey_status = p_journey_status,
         updated_at     = now()
   WHERE id = p_shipment_id;

  -- Append to audit log
  INSERT INTO public.shipment_journey_logs (shipment_id, journey_status, notes, updated_by)
  VALUES (p_shipment_id, p_journey_status, p_notes, p_updated_by);
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_update_shipment_journey(UUID, TEXT, TEXT, UUID, TIMESTAMPTZ) TO authenticated;


-- 3. rpc_assign_delivery_staff
DROP FUNCTION IF EXISTS public.rpc_assign_delivery_staff(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.rpc_assign_delivery_staff(UUID, UUID, TEXT, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION rpc_assign_delivery_staff(
  p_shipment_id UUID,
  p_staff_id UUID,
  p_vehicle_info TEXT DEFAULT NULL,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_updated_at TIMESTAMPTZ;
BEGIN
  -- OCC Guard
  IF p_expected_updated_at IS NOT NULL THEN
    SELECT updated_at INTO v_current_updated_at
    FROM shipments WHERE id = p_shipment_id FOR UPDATE;

    IF date_trunc('milliseconds', v_current_updated_at) != date_trunc('milliseconds', p_expected_updated_at) THEN
      RAISE EXCEPTION 'OCC_MISMATCH: Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.';
    END IF;
  END IF;

  UPDATE shipments
  SET delivery_staff_id = p_staff_id,
      vehicle_info = p_vehicle_info,
      updated_at = NOW()
  WHERE id = p_shipment_id;
END;
$$;


-- 4. rpc_mark_shipment_delivered
DROP FUNCTION IF EXISTS public.rpc_mark_shipment_delivered(UUID, JSONB);
DROP FUNCTION IF EXISTS public.rpc_mark_shipment_delivered(UUID, JSONB, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION rpc_mark_shipment_delivered(
  p_shipment_id UUID,
  p_data JSONB,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_updated_at TIMESTAMPTZ;
BEGIN
  -- OCC Guard
  IF p_expected_updated_at IS NOT NULL THEN
    SELECT updated_at INTO v_current_updated_at
    FROM shipments WHERE id = p_shipment_id FOR UPDATE;

    IF date_trunc('milliseconds', v_current_updated_at) != date_trunc('milliseconds', p_expected_updated_at) THEN
      RAISE EXCEPTION 'OCC_MISMATCH: Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.';
    END IF;
  END IF;

  -- Guard: only shipped can be delivered
  IF NOT EXISTS (SELECT 1 FROM shipments WHERE id = p_shipment_id AND status = 'shipped') THEN
    RAISE EXCEPTION 'SHIPMENT_NOT_SHIPPED: Cannot deliver a shipment that is not shipped';
  END IF;

  UPDATE shipments
  SET status = 'delivered'::shipment_status,
      delivered_at = NOW(),
      receiver_name = p_data->>'receiverName',
      receiver_phone = p_data->>'receiverPhone',
      delivery_proof = p_data->>'deliveryProof',
      notes = p_data->>'notes',
      updated_at = NOW()
  WHERE id = p_shipment_id;
END;
$$;
