-- ============================================================
-- Migration: Logistics Execution Subsystem (LES v2.1)
-- Description: Core schema for Multi-Stop Delivery, Attempts State Machine,
-- Idempotency Control, ePOD Evidence Assets & Transactional Outbox.
-- ============================================================

-- 1. Idempotency Control Table
CREATE TABLE IF NOT EXISTS public.logistics_command_idempotency (
  command_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  command_name VARCHAR(100) NOT NULL,
  aggregate_id UUID NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  response_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_command_idempotency_lookup
  ON public.logistics_command_idempotency(tenant_id, command_name, aggregate_id);

ALTER TABLE public.logistics_command_idempotency ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage idempotency records within their tenant"
  ON public.logistics_command_idempotency
  FOR ALL
  TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());


-- 2. Delivery Stops Table (Multi-Stop Route Support)
CREATE TABLE IF NOT EXISTS public.delivery_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  stop_sequence INTEGER NOT NULL DEFAULT 1,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  delivery_address TEXT NOT NULL,
  contact_person VARCHAR(150),
  contact_phone VARCHAR(20),
  target_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_stops_shipment
  ON public.delivery_stops(shipment_id, stop_sequence);

ALTER TABLE public.delivery_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access delivery stops within their tenant"
  ON public.delivery_stops
  FOR ALL
  TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());


-- 3. Delivery Attempts Table (State Machine & OCC)
CREATE TABLE IF NOT EXISTS public.delivery_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  stop_id UUID NOT NULL REFERENCES public.delivery_stops(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  driver_id UUID REFERENCES public.profiles(id),
  vehicle_plate VARCHAR(20),
  state VARCHAR(30) NOT NULL DEFAULT 'assigned',
  correlation_id VARCHAR(100) NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_attempts_lookup
  ON public.delivery_attempts(stop_id, attempt_number, state);

CREATE INDEX IF NOT EXISTS idx_delivery_attempts_driver
  ON public.delivery_attempts(driver_id, state);

ALTER TABLE public.delivery_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access delivery attempts within their tenant"
  ON public.delivery_attempts
  FOR ALL
  TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());


-- 4. Shipment ePOD Evidences Table (Immutable Legal Record & Hash Chain)
CREATE TABLE IF NOT EXISTS public.shipment_epod_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  attempt_id UUID NOT NULL REFERENCES public.delivery_attempts(id) ON DELETE CASCADE,
  receiver_name VARCHAR(150) NOT NULL,
  receiver_phone VARCHAR(20),
  receiver_identity_type VARCHAR(20),
  receiver_identity_value VARCHAR(50),
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  accuracy_meters NUMERIC(6, 2),
  device_id VARCHAR(100) NOT NULL,
  submitted_by UUID NOT NULL REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evidence_hash VARCHAR(64) NOT NULL,
  previous_evidence_hash VARCHAR(64),
  verification_status VARCHAR(20) DEFAULT 'verified',
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_epod_attempt
  ON public.shipment_epod_evidences(attempt_id);

ALTER TABLE public.shipment_epod_evidences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view epod evidences within their tenant"
  ON public.shipment_epod_evidences
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Users can insert epod evidences within their tenant"
  ON public.shipment_epod_evidences
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id());


-- 5. ePOD Evidence Assets Table (Signature, Overview, Label Photos)
CREATE TABLE IF NOT EXISTS public.epod_evidence_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  evidence_id UUID NOT NULL REFERENCES public.shipment_epod_evidences(id) ON DELETE CASCADE,
  asset_type VARCHAR(30) NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  telemetry_lat NUMERIC(10, 7),
  telemetry_lng NUMERIC(10, 7),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_evidence_assets_lookup
  ON public.epod_evidence_assets(evidence_id, asset_type);

ALTER TABLE public.epod_evidence_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view evidence assets within their tenant"
  ON public.epod_evidence_assets
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Users can insert evidence assets within their tenant"
  ON public.epod_evidence_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id());


-- 6. Delivery Exceptions Table (Delivery Issue Management)
CREATE TABLE IF NOT EXISTS public.delivery_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  attempt_id UUID NOT NULL REFERENCES public.delivery_attempts(id) ON DELETE CASCADE,
  exception_type VARCHAR(50) NOT NULL,
  reason_detail TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  reported_by UUID NOT NULL REFERENCES public.profiles(id),
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolution_action VARCHAR(50),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_delivery_exceptions_attempt
  ON public.delivery_exceptions(attempt_id, status);

ALTER TABLE public.delivery_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage delivery exceptions within their tenant"
  ON public.delivery_exceptions
  FOR ALL
  TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());


-- 7. Transactional Outbox Events Table
CREATE TABLE IF NOT EXISTS public.logistics_outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  event_type VARCHAR(100) NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL,
  aggregate_id UUID NOT NULL,
  correlation_id VARCHAR(100) NOT NULL,
  causation_id UUID,
  schema_version INTEGER NOT NULL DEFAULT 1,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dispatched_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_logistics_outbox_pending
  ON public.logistics_outbox_events(status, created_at ASC);

ALTER TABLE public.logistics_outbox_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access logistics outbox events within their tenant"
  ON public.logistics_outbox_events
  FOR ALL
  TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());
