-- Add p_photo_url param to rpc_update_shipment_journey
-- Keeps original signature (p_updated_by UUID, p_expected_updated_at TIMESTAMPTZ)
-- and adds p_photo_url TEXT DEFAULT NULL

DROP FUNCTION IF EXISTS public.rpc_update_shipment_journey(UUID, TEXT, TEXT, UUID, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION public.rpc_update_shipment_journey(
  p_shipment_id          UUID,
  p_journey_status       TEXT,
  p_notes                TEXT        DEFAULT NULL,
  p_updated_by           UUID        DEFAULT NULL,
  p_expected_updated_at  TIMESTAMPTZ DEFAULT NULL,
  p_photo_url            TEXT        DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status     TEXT;
  v_journey_status     TEXT;
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

  -- Append to audit log with optional photo_url
  INSERT INTO public.shipment_journey_logs (shipment_id, journey_status, notes, photo_url, updated_by)
  VALUES (p_shipment_id, p_journey_status, p_notes, p_photo_url, p_updated_by);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_update_shipment_journey(UUID, TEXT, TEXT, UUID, TIMESTAMPTZ, TEXT) TO authenticated;
