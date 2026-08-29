-- ============================================================
-- Migration: Fix submitted_by profile fallback in LES RPCs (LES v2.1)
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_submit_delivery_epod(
  p_command_id UUID,
  p_attempt_id UUID,
  p_expected_state VARCHAR,
  p_receiver JSONB,
  p_telemetry JSONB,
  p_evidence_hash VARCHAR,
  p_previous_evidence_hash VARCHAR DEFAULT NULL,
  p_assets JSONB DEFAULT '[]'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_existing JSONB;
  v_attempt RECORD;
  v_evidence_id UUID;
  v_asset JSONB;
  v_shipment_id UUID;
  v_result JSONB;
BEGIN
  v_tenant_id := public.current_tenant_id();
  v_user_id := auth.uid();

  IF v_tenant_id IS NULL THEN
    SELECT tenant_id INTO v_tenant_id
    FROM public.delivery_attempts
    WHERE id = p_attempt_id;
  END IF;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Cannot resolve tenant for delivery attempt (id=%)', p_attempt_id;
  END IF;

  -- 1. Idempotency Check
  SELECT response_payload INTO v_existing
  FROM public.logistics_command_idempotency
  WHERE command_id = p_command_id;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- 2. Concurrency Guard (OCC) & Transition Attempt to 'delivered'
  UPDATE public.delivery_attempts
  SET
    state = 'delivered',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_attempt_id
    AND state = p_expected_state
    AND tenant_id = v_tenant_id
  RETURNING * INTO v_attempt;

  IF v_attempt.id IS NULL THEN
    RAISE EXCEPTION 'CONCURRENCY_CONFLICT: Không thể nộp ePOD do trạng thái chuyến giao không khớp (expected=%)', p_expected_state;
  END IF;

  -- Resolve submitted_by fallback if caller is background service
  IF v_user_id IS NULL THEN
    v_user_id := COALESCE(v_attempt.driver_id, (SELECT id FROM public.profiles WHERE tenant_id = v_tenant_id LIMIT 1));
  END IF;

  -- 3. Insert ePOD Evidence
  INSERT INTO public.shipment_epod_evidences (
    tenant_id, attempt_id, receiver_name, receiver_phone,
    receiver_identity_type, receiver_identity_value,
    latitude, longitude, accuracy_meters, device_id,
    submitted_by, submitted_at, evidence_hash, previous_evidence_hash,
    verification_status
  ) VALUES (
    v_tenant_id, p_attempt_id,
    COALESCE(p_receiver->>'name', 'Khách hàng'),
    p_receiver->>'phone',
    p_receiver->>'identity_type',
    p_receiver->>'identity_value',
    COALESCE((p_telemetry->>'latitude')::NUMERIC, (p_telemetry->>'lat')::NUMERIC, 0),
    COALESCE((p_telemetry->>'longitude')::NUMERIC, (p_telemetry->>'lng')::NUMERIC, 0),
    (p_telemetry->>'accuracy_meters')::NUMERIC,
    COALESCE(p_telemetry->>'device_id', 'unknown-device'),
    v_user_id, NOW(),
    p_evidence_hash, p_previous_evidence_hash,
    'verified'
  )
  RETURNING id INTO v_evidence_id;

  -- 4. Batch Insert Evidence Assets
  IF jsonb_array_length(p_assets) > 0 THEN
    FOR v_asset IN SELECT * FROM jsonb_array_elements(p_assets)
    LOOP
      INSERT INTO public.epod_evidence_assets (
        tenant_id, evidence_id, asset_type, storage_path,
        file_size_bytes, mime_type, content_hash,
        captured_at, telemetry_lat, telemetry_lng, metadata
      ) VALUES (
        v_tenant_id, v_evidence_id,
        COALESCE(v_asset->>'asset_type', 'goods_overview'),
        COALESCE(v_asset->>'storage_path', ''),
        COALESCE((v_asset->>'file_size_bytes')::INTEGER, 0),
        COALESCE(v_asset->>'mime_type', 'image/webp'),
        COALESCE(v_asset->>'content_hash', ''),
        COALESCE((v_asset->>'captured_at')::TIMESTAMPTZ, NOW()),
        (v_asset->>'telemetry_lat')::NUMERIC,
        (v_asset->>'telemetry_lng')::NUMERIC,
        COALESCE(v_asset->'metadata', '{}'::jsonb)
      );
    END LOOP;
  END IF;

  -- 5. Update Parent Delivery Stop Status
  UPDATE public.delivery_stops
  SET
    status = 'delivered',
    updated_at = NOW()
  WHERE id = v_attempt.stop_id
  RETURNING shipment_id INTO v_shipment_id;

  -- 6. Check If All Stops In Shipment Are Delivered -> Update Shipment Projection
  IF v_shipment_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.delivery_stops
      WHERE shipment_id = v_shipment_id AND status != 'delivered'
    ) THEN
      UPDATE public.shipments
      SET status = 'delivered', updated_at = NOW()
      WHERE id = v_shipment_id;
    END IF;
  END IF;

  -- 7. Insert Transactional Outbox Event
  INSERT INTO public.logistics_outbox_events (
    tenant_id, event_type, aggregate_type, aggregate_id,
    correlation_id, causation_id, payload, status
  ) VALUES (
    v_tenant_id, 'DELIVERY.EPOD_SUBMITTED', 'delivery_attempt', p_attempt_id,
    v_attempt.correlation_id, p_command_id,
    jsonb_build_object(
      'attempt_id', p_attempt_id,
      'stop_id', v_attempt.stop_id,
      'shipment_id', v_shipment_id,
      'evidence_id', v_evidence_id,
      'evidence_hash', p_evidence_hash,
      'receiver_name', p_receiver->>'name',
      'receiver_phone', p_receiver->>'phone',
      'actor_id', v_user_id,
      'occurred_at', NOW()
    ),
    'pending'
  );

  -- 8. Prepare and Save Idempotency Result
  v_result := jsonb_build_object(
    'ok', true,
    'attempt_id', v_attempt.id,
    'evidence_id', v_evidence_id,
    'evidence_hash', p_evidence_hash,
    'status', 'delivered',
    'submitted_at', NOW()
  );

  INSERT INTO public.logistics_command_idempotency (
    command_id, tenant_id, command_name, aggregate_id, actor_id, response_payload
  ) VALUES (
    p_command_id, v_tenant_id, 'submit_delivery_epod', p_attempt_id, v_user_id, v_result
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.rpc_submit_delivery_epod(UUID, UUID, VARCHAR, JSONB, JSONB, VARCHAR, VARCHAR, JSONB) TO authenticated;
