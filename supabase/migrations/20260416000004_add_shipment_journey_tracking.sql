-- Migration: Add journey tracking for drivers
-- Adds journey_status field to shipments for granular delivery milestone tracking

-- 1. Add journey_status column
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS journey_status TEXT
    CHECK (journey_status IN ('pending_pickup', 'picked_up', 'in_transit', 'arrived', 'delivered_confirmed'))
    DEFAULT NULL;

COMMENT ON COLUMN public.shipments.journey_status IS
  'Trang thai hanh trinh chi tiet do tai xe cap nhat: pending_pickup -> picked_up -> in_transit -> arrived -> delivered_confirmed';

-- 2. Journey log table for audit trail
CREATE TABLE IF NOT EXISTS public.shipment_journey_logs (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id   UUID    NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  journey_status TEXT   NOT NULL CHECK (journey_status IN ('pending_pickup', 'picked_up', 'in_transit', 'arrived', 'delivered_confirmed')),
  notes         TEXT,
  updated_by    UUID    REFERENCES public.employees(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journey_logs_shipment ON public.shipment_journey_logs (shipment_id, created_at DESC);

-- 3. RLS
ALTER TABLE public.shipment_journey_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read journey logs" ON public.shipment_journey_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert journey logs" ON public.shipment_journey_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- 4. RPC: atomic update journey status with logging
CREATE OR REPLACE FUNCTION atomic_update_shipment_journey(
  p_shipment_id    UUID,
  p_journey_status TEXT,
  p_notes          TEXT DEFAULT NULL,
  p_updated_by     UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status TEXT;
  v_journey_status TEXT;
BEGIN
  SELECT status, journey_status
    INTO v_current_status, v_journey_status
    FROM public.shipments
   WHERE id = p_shipment_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SHIPMENT_NOT_FOUND';
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

GRANT EXECUTE ON FUNCTION atomic_update_shipment_journey(UUID, TEXT, TEXT, UUID) TO authenticated;
