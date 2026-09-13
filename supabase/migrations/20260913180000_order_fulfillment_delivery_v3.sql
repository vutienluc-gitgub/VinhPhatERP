-- ============================================================================
-- Migration: Order Fulfillment & Delivery Architecture v3.0
-- Scope:
-- 1. Bổ sung Line-Item Fulfillment trên order_items
-- 2. Sửa fn_create_order_atomic: Loại bỏ việc cộng nợ tự động vào current_debt
-- 3. Tạo RPCs nguyên tử: rpc_unreserve_finished_roll, rpc_release_order_reservations
-- 4. Cập nhật rpc_confirm_shipment: Hạch toán nợ tại thời điểm xuất kho thực tế
-- 5. Tạo bảng delivery_trips, delivery_trip_stops (Chuyến xe & Điểm dừng)
-- 6. Tạo bảng delivery_proof_records (ePOD Immutable)
-- 7. Tạo bảng rma_requests, rma_items (Chu trình hàng trả & kiểm định)
-- 8. Tạo rpc_record_pod_delivery: Ghi POD và tự động cập nhật Line Fulfillment
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Bổ sung các trường Line-Item Fulfillment trên bảng order_items
-- ----------------------------------------------------------------------------
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS ordered_qty NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fulfilled_qty NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS returned_qty NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancelled_qty NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_order_items_fulfillment_status'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT chk_order_items_fulfillment_status
      CHECK (fulfillment_status IN ('unfulfilled', 'partially_fulfilled', 'fulfilled', 'closed_shortage'));
  END IF;
END $$;

-- Backfill số lượng đã đặt từ quantity
UPDATE public.order_items
SET ordered_qty = COALESCE(quantity, 0)
WHERE ordered_qty = 0 AND quantity > 0;


-- ----------------------------------------------------------------------------
-- 2. Sửa fn_create_order_atomic (13 params, JSONB return): BỎ CỘNG NỢ TẠI ORDER CREATE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_create_order_atomic(
  p_order_number TEXT,
  p_order_type TEXT,
  p_customer_id UUID,
  p_order_date DATE,
  p_delivery_date DATE,
  p_total_amount NUMERIC,
  p_notes TEXT,
  p_source_quotation_id UUID,
  p_created_by UUID,
  p_items JSONB,
  p_allocations JSONB,
  p_manager_override BOOLEAN DEFAULT false,
  p_override_user_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_item_id UUID;
  v_item_ids UUID[] := '{}';
  v_item JSONB;
  v_alloc JSONB;
  v_alloc_item_idx INT;
  v_alloc_roll_id UUID;
  v_alloc_meters NUMERIC;
  v_tenant UUID;
  v_cust RECORD;
BEGIN
  -- Lấy tenant_id từ profiles của người gọi
  SELECT tenant_id INTO v_tenant FROM public.profiles WHERE id = auth.uid();
  IF v_tenant IS NULL THEN
    SELECT tenant_id INTO v_tenant FROM public.profiles WHERE id = p_created_by;
  END IF;

  -- 1. Kiểm tra hạn mức tín dụng của Khách hàng (Gate validation)
  SELECT credit_limit, current_debt, overdue_debt, credit_status
  INTO v_cust
  FROM public.customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CUSTOMER_NOT_FOUND: Không tìm thấy khách hàng.';
  END IF;

  IF v_cust.credit_status = 'blocked' THEN
    RAISE EXCEPTION 'CREDIT_BLOCKED: Khách hàng đang bị khóa giao dịch tín dụng.';
  END IF;

  IF NOT COALESCE(p_manager_override, false) THEN
    IF COALESCE(v_cust.overdue_debt, 0) > 0 THEN
      RAISE EXCEPTION 'OVERDUE_DEBT: Khách hàng đang có nợ quá hạn. Yêu cầu Quản lý phê duyệt (Override).';
    END IF;
    IF (COALESCE(v_cust.current_debt, 0) + p_total_amount) > COALESCE(v_cust.credit_limit, 0) THEN
      RAISE EXCEPTION 'CREDIT_LIMIT_EXCEEDED: Giá trị đơn hàng làm vượt hạn mức tín dụng. Yêu cầu Quản lý phê duyệt.';
    END IF;
  END IF;

  -- 2. Tạo Order Header
  INSERT INTO public.orders (
    order_number, order_type, customer_id, order_date, delivery_date,
    total_amount, status, notes, source_quotation_id, created_by, tenant_id,
    manager_override_by
  )
  VALUES (
    p_order_number, COALESCE(p_order_type, 'production'), p_customer_id, p_order_date, p_delivery_date,
    p_total_amount, 'confirmed', p_notes, p_source_quotation_id, p_created_by, v_tenant,
    p_override_user_id
  )
  RETURNING id INTO v_order_id;

  -- 3. Tạo Order Items với chỉ số Line-Fulfillment
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id, fabric_type, color_name, color_code, width_cm,
      unit, quantity, unit_price, notes, sort_order, tenant_id,
      ordered_qty, fulfilled_qty, returned_qty, cancelled_qty, fulfillment_status
    )
    VALUES (
      v_order_id,
      v_item->>'fabric_type',
      NULLIF(v_item->>'color_name', ''),
      NULLIF(v_item->>'color_code', ''),
      NULLIF(v_item->>'width_cm', '')::NUMERIC,
      COALESCE(v_item->>'unit', 'm'),
      (v_item->>'quantity')::NUMERIC,
      (v_item->>'unit_price')::NUMERIC,
      NULLIF(v_item->>'notes', ''),
      (v_item->>'sort_order')::SMALLINT,
      v_tenant,
      (v_item->>'quantity')::NUMERIC, 0, 0, 0, 'unfulfilled'
    )
    RETURNING id INTO v_item_id;

    v_item_ids := v_item_ids || v_item_id;
  END LOOP;

  -- 4. FIFO allocation + Khóa cuộn vải (Reserved)
  IF p_allocations IS NOT NULL THEN
    FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_allocations)
    LOOP
      v_alloc_item_idx := (v_alloc->>'item_index')::INT;
      v_alloc_roll_id  := (v_alloc->>'roll_id')::UUID;
      v_alloc_meters   := (v_alloc->>'allocated_meters')::NUMERIC;

      v_item_id := v_item_ids[v_alloc_item_idx + 1];

      INSERT INTO public.order_lot_allocations (order_id, order_item_id, roll_id, allocated_meters, tenant_id)
      VALUES (v_order_id, v_item_id, v_alloc_roll_id, v_alloc_meters, v_tenant);

      UPDATE public.finished_fabric_rolls
      SET status = 'reserved', reserved_for_order_id = v_order_id, updated_at = NOW()
      WHERE id = v_alloc_roll_id AND status = 'in_stock';

      IF NOT FOUND THEN
        RAISE EXCEPTION 'CONCURRENT_RESERVATION: Roll % đã bị đặt trước bởi đơn hàng khác.', v_alloc_roll_id;
      END IF;
    END LOOP;
  END IF;

  -- ⚠️ QUY TẮC CỐT TỬ SRS v3.0:
  -- ĐÃ LOẠI BỎ: UPDATE customers SET current_debt = current_debt + p_total_amount;
  -- Công nợ CHỈ được hạch toán khi xuất kho thực tế tại rpc_confirm_shipment.

  -- 5. Ghi Audit Log
  INSERT INTO public.business_audit_log (event_type, entity_type, entity_id, user_id, payload, tenant_id)
  VALUES (
    'ORDER_CREATED', 'order', v_order_id, p_created_by,
    jsonb_build_object(
      'order_number',        p_order_number,
      'customer_id',         p_customer_id,
      'total_amount',        p_total_amount,
      'order_type',          COALESCE(p_order_type, 'production'),
      'reserved_rolls_count', COALESCE(jsonb_array_length(p_allocations), 0),
      'manager_override',    p_manager_override
    ),
    v_tenant
  );

  -- 6. Đánh dấu quotation đã convert (nếu có)
  IF p_source_quotation_id IS NOT NULL THEN
    UPDATE public.quotations
    SET status = 'converted', converted_order_id = v_order_id, confirmed_at = NOW()
    WHERE id = p_source_quotation_id AND status IN ('confirmed', 'sent');
  END IF;

  RETURN jsonb_build_object('order_id', v_order_id, 'status', 'confirmed');
END;
$$;


-- ----------------------------------------------------------------------------
-- 3. Atomic RPCs cho Unreserve & Release Order Reservations
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_unreserve_finished_roll(
  p_roll_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status text;
  v_tenant uuid;
BEGIN
  SELECT tenant_id INTO v_tenant FROM public.profiles WHERE id = auth.uid();

  -- Lock row để tránh Race Condition
  SELECT status INTO v_status
  FROM public.finished_fabric_rolls
  WHERE id = p_roll_id
    AND (v_tenant IS NULL OR tenant_id = v_tenant)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ROLL_NOT_FOUND: Không tìm thấy cuộn vải.';
  END IF;

  IF v_status != 'reserved' THEN
    RAISE EXCEPTION 'ROLL_NOT_RESERVED: Cuộn vải không ở trạng thái giữ chỗ (reserved).';
  END IF;

  UPDATE public.finished_fabric_rolls
  SET status = 'in_stock',
      reserved_for_order_id = NULL,
      updated_at = NOW()
  WHERE id = p_roll_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_unreserve_finished_roll(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_release_order_reservations(
  p_order_id UUID
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  WITH released AS (
    UPDATE public.finished_fabric_rolls
    SET status = 'in_stock',
        reserved_for_order_id = NULL,
        updated_at = NOW()
    WHERE reserved_for_order_id = p_order_id
      AND status = 'reserved'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM released;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_release_order_reservations(UUID) TO authenticated;


-- ----------------------------------------------------------------------------
-- 4. Cập nhật rpc_confirm_shipment: HẠCH TOÁN NỢ TẠI THỜI ĐIỂM XUẤT KHO THỰC TẾ
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_confirm_shipment(
  p_shipment_id UUID,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_roll_ids UUID[];
  v_current_updated_at TIMESTAMPTZ;
  v_shipment RECORD;
  v_shipment_value NUMERIC(18,2) := 0;
  v_order RECORD;
  v_tenant UUID;
BEGIN
  -- OCC Guard
  SELECT * INTO v_shipment
  FROM public.shipments
  WHERE id = p_shipment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SHIPMENT_NOT_FOUND';
  END IF;

  IF p_expected_updated_at IS NOT NULL THEN
    IF date_trunc('milliseconds', v_shipment.updated_at) != date_trunc('milliseconds', p_expected_updated_at) THEN
      RAISE EXCEPTION 'OCC_MISMATCH: Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.';
    END IF;
  END IF;

  -- Guard: only preparing can be confirmed
  IF v_shipment.status != 'preparing' THEN
    RAISE EXCEPTION 'SHIPMENT_NOT_PREPARING: Cannot confirm a shipment that is not in preparing status';
  END IF;

  -- 1. Thu thập cuộn vải trong phiếu
  SELECT ARRAY_AGG(finished_roll_id)
  INTO v_roll_ids
  FROM public.shipment_items
  WHERE shipment_id = p_shipment_id AND finished_roll_id IS NOT NULL;

  -- 2. Cập nhật Shipment status
  UPDATE public.shipments
  SET status = 'shipped'::shipment_status,
      shipped_at = NOW(),
      updated_at = NOW()
  WHERE id = p_shipment_id;

  -- 3. Trừ tồn kho cuộn vải thực tế (reserved -> shipped)
  IF v_roll_ids IS NOT NULL AND array_length(v_roll_ids, 1) > 0 THEN
    UPDATE public.finished_fabric_rolls
    SET status = 'shipped',
        reserved_for_order_id = NULL,
        shipped_at = NOW(),
        updated_at = NOW()
    WHERE id = ANY(v_roll_ids);
  END IF;

  -- 4. Hạch toán công nợ Kế toán (AR Debt Recognition) tại thời điểm xuất kho thực tế
  IF v_shipment.order_id IS NOT NULL AND v_shipment.customer_id IS NOT NULL THEN
    -- Tính giá trị phiếu xuất từ các dòng hàng
    SELECT COALESCE(SUM(
      si.quantity * COALESCE(oi.unit_price, 0)
    ), 0)
    INTO v_shipment_value
    FROM public.shipment_items si
    LEFT JOIN public.order_items oi 
      ON oi.order_id = v_shipment.order_id 
     AND oi.fabric_type = si.fabric_type
    WHERE si.shipment_id = p_shipment_id;

    -- Tăng công nợ thực tế cho khách hàng
    IF v_shipment_value > 0 THEN
      UPDATE public.customers
      SET current_debt = current_debt + v_shipment_value,
          updated_at = NOW()
      WHERE id = v_shipment.customer_id;
    END IF;
  END IF;

  -- 5. Ghi Audit Log
  INSERT INTO public.business_audit_log (event_type, entity_type, entity_id, payload, tenant_id)
  VALUES (
    'SHIPMENT_CONFIRMED_STOCK_ISSUED', 'shipments', p_shipment_id,
    jsonb_build_object(
      'shipment_number', v_shipment.shipment_number,
      'order_id', v_shipment.order_id,
      'customer_id', v_shipment.customer_id,
      'debited_amount', v_shipment_value,
      'roll_count', COALESCE(array_length(v_roll_ids, 1), 0)
    ),
    v_shipment.tenant_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ----------------------------------------------------------------------------
-- 5. Bảng Chuyến xe (Delivery Trips) & Điểm dừng (Trip Stops)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_number TEXT NOT NULL UNIQUE,
  driver_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  vehicle_plate TEXT NOT NULL,
  max_payload_kg NUMERIC(10,2),
  planned_start_at TIMESTAMPTZ,
  actual_start_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'assigned', 'in_transit', 'completed', 'cancelled')),
  notes TEXT,
  tenant_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delivery_trip_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.delivery_trips(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE RESTRICT,
  stop_sequence INT NOT NULL,
  estimated_arrival TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  stop_status TEXT NOT NULL DEFAULT 'pending' CHECK (stop_status IN ('pending', 'arrived', 'completed', 'failed', 'skipped')),
  failure_reason TEXT,
  tenant_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for delivery_trips
ALTER TABLE public.delivery_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_trip_stops ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'delivery_trips_read_policy') THEN
    CREATE POLICY delivery_trips_read_policy ON public.delivery_trips FOR SELECT TO authenticated USING (true);
    CREATE POLICY delivery_trips_write_policy ON public.delivery_trips FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'delivery_trip_stops_read_policy') THEN
    CREATE POLICY delivery_trip_stops_read_policy ON public.delivery_trip_stops FOR SELECT TO authenticated USING (true);
    CREATE POLICY delivery_trip_stops_write_policy ON public.delivery_trip_stops FOR ALL TO authenticated USING (true);
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 6. Bảng Bằng chứng Giao nhận Điện tử (ePOD Immutable)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_proof_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE RESTRICT,
  trip_id UUID REFERENCES public.delivery_trips(id) ON DELETE SET NULL,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT,
  signature_image_url TEXT NOT NULL,
  evidence_photos TEXT[] NOT NULL DEFAULT '{}',
  geo_latitude NUMERIC(10, 7),
  geo_longitude NUMERIC(10, 7),
  device_info JSONB,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hash_checksum TEXT NOT NULL,
  tenant_id UUID,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.delivery_proof_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'delivery_proof_records_read') THEN
    CREATE POLICY delivery_proof_records_read ON public.delivery_proof_records FOR SELECT TO authenticated USING (true);
    CREATE POLICY delivery_proof_records_insert ON public.delivery_proof_records FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- Ràng buộc chống sửa và chống xóa POD
CREATE OR REPLACE RULE no_update_pod AS ON UPDATE TO public.delivery_proof_records DO INSTEAD NOTHING;
CREATE OR REPLACE RULE no_delete_pod AS ON DELETE TO public.delivery_proof_records DO INSTEAD NOTHING;


-- ----------------------------------------------------------------------------
-- 7. Bảng Quản lý Trả hàng (RMA) & Kho Cách ly (Quarantine)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rma_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rma_number TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'quarantine', 'inspected', 'completed', 'rejected')),
  reason TEXT NOT NULL,
  notes TEXT,
  tenant_id UUID,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rma_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rma_id UUID NOT NULL REFERENCES public.rma_requests(id) ON DELETE CASCADE,
  roll_id UUID REFERENCES public.finished_fabric_rolls(id) ON DELETE RESTRICT,
  fabric_type TEXT NOT NULL,
  color_name TEXT,
  returned_length_m NUMERIC(10,2),
  returned_weight_kg NUMERIC(10,2),
  disposition TEXT CHECK (disposition IN ('restock', 'rework', 'scrap', 'pending')),
  notes TEXT,
  tenant_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rma_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rma_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rma_requests_policy') THEN
    CREATE POLICY rma_requests_policy ON public.rma_requests FOR ALL TO authenticated USING (true);
    CREATE POLICY rma_items_policy ON public.rma_items FOR ALL TO authenticated USING (true);
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 8. RPC rpc_record_pod_delivery: Ghi POD bất biến & Cập nhật Line-Item Fulfillment
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_record_pod_delivery(
  p_shipment_id          UUID,
  p_trip_id              UUID DEFAULT NULL,
  p_receiver_name        TEXT DEFAULT '',
  p_receiver_phone       TEXT DEFAULT NULL,
  p_signature_image_url  TEXT DEFAULT '',
  p_evidence_photos      TEXT[] DEFAULT '{}',
  p_geo_latitude         NUMERIC DEFAULT NULL,
  p_geo_longitude        NUMERIC DEFAULT NULL,
  p_notes                TEXT DEFAULT NULL,
  p_expected_updated_at  TIMESTAMPTZ DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shipment RECORD;
  v_order_id UUID;
  v_checksum TEXT;
  v_item RECORD;
  v_all_lines_fulfilled BOOLEAN;
BEGIN
  -- 1. Lock shipment record & OCC guard
  SELECT * INTO v_shipment
  FROM public.shipments
  WHERE id = p_shipment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SHIPMENT_NOT_FOUND: Không tìm thấy phiếu xuất kho.';
  END IF;

  IF p_expected_updated_at IS NOT NULL THEN
    IF date_trunc('milliseconds', v_shipment.updated_at) != date_trunc('milliseconds', p_expected_updated_at) THEN
      RAISE EXCEPTION 'OCC_MISMATCH: Dữ liệu phiếu xuất đã bị thay đổi bởi người khác.';
    END IF;
  END IF;

  IF v_shipment.status != 'shipped' THEN
    RAISE EXCEPTION 'SHIPMENT_NOT_SHIPPED: Phiếu xuất phải ở trạng thái "Đang giao" mới xác nhận nhận hàng.';
  END IF;

  -- 2. Sinh mã checksum bất biến
  v_checksum := md5(
    p_shipment_id::text || 
    COALESCE(p_receiver_name, '') || 
    NOW()::text || 
    COALESCE(p_signature_image_url, '')
  );

  -- 3. Ghi bản ghi POD Bất biến (Immutable Evidence Record)
  INSERT INTO public.delivery_proof_records (
    shipment_id, trip_id, receiver_name, receiver_phone,
    signature_image_url, evidence_photos, geo_latitude, geo_longitude,
    captured_at, hash_checksum, tenant_id, created_by
  ) VALUES (
    p_shipment_id, p_trip_id, COALESCE(p_receiver_name, 'Khách nhận'), p_receiver_phone,
    COALESCE(p_signature_image_url, ''), COALESCE(p_evidence_photos, '{}'),
    p_geo_latitude, p_geo_longitude, NOW(), v_checksum, v_shipment.tenant_id, auth.uid()
  );

  -- 4. Cập nhật trạng thái phiếu xuất kho sang 'delivered'
  UPDATE public.shipments
  SET status = 'delivered'::shipment_status,
      delivered_at = NOW(),
      receiver_name = COALESCE(p_receiver_name, receiver_name),
      receiver_phone = COALESCE(p_receiver_phone, receiver_phone),
      delivery_proof = COALESCE(p_signature_image_url, delivery_proof),
      notes = COALESCE(p_notes, notes),
      updated_at = NOW()
  WHERE id = p_shipment_id;

  -- 5. Cập nhật Line-Item Fulfillment cho đơn hàng liên kết
  v_order_id := v_shipment.order_id;
  IF v_order_id IS NOT NULL THEN
    -- Duyệt qua các mặt hàng trong phiếu xuất vừa giao
    FOR v_item IN (
      SELECT si.fabric_type, si.quantity
      FROM public.shipment_items si
      WHERE si.shipment_id = p_shipment_id
    ) LOOP
      -- Cộng dồn fulfilled_qty cho dòng hàng tương ứng
      UPDATE public.order_items
      SET fulfilled_qty = fulfilled_qty + v_item.quantity,
          fulfillment_status = CASE
            WHEN (fulfilled_qty + v_item.quantity) >= ordered_qty THEN 'fulfilled'
            ELSE 'partially_fulfilled'
          END
      WHERE order_id = v_order_id
        AND fabric_type = v_item.fabric_type;
    END LOOP;

    -- 6. Đánh giá hoàn tất Đơn hàng: Đơn chỉ completed khi 100% dòng hàng hoàn tất
    SELECT NOT EXISTS (
      SELECT 1 FROM public.order_items
      WHERE order_id = v_order_id
        AND fulfillment_status NOT IN ('fulfilled', 'closed_shortage')
    ) INTO v_all_lines_fulfilled;

    IF v_all_lines_fulfilled THEN
      UPDATE public.orders
      SET status = 'completed',
          updated_at = NOW()
      WHERE id = v_order_id
        AND status != 'completed';
    END IF;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_record_pod_delivery TO authenticated;
