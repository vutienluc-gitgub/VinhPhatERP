-- ePOD (Electronic Proof of Delivery) schema additions
-- Phase 2 + 3: signature, proof photos, signed_at on shipments

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS customer_signature_url TEXT,
  ADD COLUMN IF NOT EXISTS proof_photos            TEXT[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS signed_at               TIMESTAMPTZ;

-- Public-facing RPC: returns minimal shipment info for /verify page
-- Callable by anon role (no auth required for QR-scanned verify page)
CREATE OR REPLACE FUNCTION public.rpc_get_public_shipment(
  p_number TEXT
)
RETURNS TABLE (
  shipment_number     TEXT,
  shipment_date       TEXT,
  status              TEXT,
  journey_status      TEXT,
  customer_name       TEXT,
  delivery_address    TEXT,
  item_count          INT,
  items               JSONB,
  journey_logs        JSONB,
  customer_signature_url TEXT,
  signed_at           TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shipment_id UUID;
BEGIN
  SELECT s.id INTO v_shipment_id
  FROM public.shipments s
  WHERE s.shipment_number = p_number
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    s.shipment_number::TEXT,
    s.shipment_date::TEXT,
    s.status::TEXT,
    s.journey_status::TEXT,
    c.name::TEXT                                  AS customer_name,
    COALESCE(s.delivery_address, c.address)::TEXT AS delivery_address,
    COUNT(si.id)::INT                             AS item_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'fabric_type', si.fabric_type,
          'color_name',  si.color_name,
          'quantity',    si.quantity,
          'unit',        si.unit
        ) ORDER BY si.sort_order
      ) FILTER (WHERE si.id IS NOT NULL),
      '[]'::jsonb
    )                                             AS items,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'status',     jl.journey_status,
            'created_at', jl.created_at
          ) ORDER BY jl.created_at
        )
        FROM public.shipment_journey_logs jl
        WHERE jl.shipment_id = s.id
      ),
      '[]'::jsonb
    )                                             AS journey_logs,
    s.customer_signature_url::TEXT,
    s.signed_at
  FROM public.shipments s
  LEFT JOIN public.customers    c  ON c.id  = s.customer_id
  LEFT JOIN public.shipment_items si ON si.shipment_id = s.id
  WHERE s.shipment_number = p_number
  GROUP BY s.id, s.shipment_number, s.shipment_date, s.status,
           s.journey_status, c.name, s.delivery_address, c.address,
           s.customer_signature_url, s.signed_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_get_public_shipment(TEXT) TO anon, authenticated;

-- RPC to save signature + signed_at after customer signs (called by driver)
CREATE OR REPLACE FUNCTION public.rpc_save_delivery_signature(
  p_shipment_id          UUID,
  p_customer_signature_url TEXT,
  p_signed_at            TIMESTAMPTZ DEFAULT NOW()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.shipments
  SET customer_signature_url = p_customer_signature_url,
      signed_at              = p_signed_at,
      updated_at             = NOW()
  WHERE id = p_shipment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_save_delivery_signature(UUID, TEXT, TIMESTAMPTZ) TO authenticated;
