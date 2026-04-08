-- Migration: RPC to sync customer debt from shipment total
-- Purpose: Maintain consistency between warehouse shipments and financial receivables.

CREATE OR REPLACE FUNCTION public.sync_shipment_debt(p_shipment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shipment      RECORD;
  v_total_amount  NUMERIC(14,2);
  v_old_amount    NUMERIC(14,2);
  v_delta         NUMERIC(14,2);
  v_tenant        UUID;
BEGIN
  -- 1. Get shipment & tenant info
  SELECT s.id, s.customer_id, s.tenant_id, s.status INTO v_shipment 
  FROM public.shipments s WHERE s.id = p_shipment_id;
  
  -- LOCK customer_debt row to prevent race conditions during calculation
  IF v_shipment.customer_id IS NOT NULL THEN
    PERFORM 1 FROM public.customer_debt 
    WHERE customer_id = v_shipment.customer_id AND tenant_id = v_shipment.tenant_id
    FOR UPDATE;
  END IF;

  IF v_shipment.id IS NULL THEN
    -- If shipment is already deleted, we need its old transaction info
    -- This is why we rely on AFTER DELETE triggers or specific logic
    RETURN;
  END IF;

  v_tenant := v_shipment.tenant_id;

  -- 2. Chỉ tính tiền đối với các trạng thái đã xuất kho thực tế (hoặc đang giao)
  IF v_shipment.status = 'preparing' THEN
    -- Nếu chuyển từ 'shipped' về 'preparing', chúng ta trả lại nợ? 
    -- Trong ERP thực tế: Xoá nợ cũ nếu trạng thái quay về preparing.
    DELETE FROM public.debt_transactions 
    WHERE shipment_id = p_shipment_id AND type = 'shipment'
    RETURNING amount INTO v_old_amount;
    
    IF v_old_amount IS NOT NULL THEN
       UPDATE public.customer_debt 
       SET balance = balance - v_old_amount, updated_at = now()
       WHERE customer_id = v_shipment.customer_id AND tenant_id = v_tenant;
    END IF;
    
    RETURN;
  END IF;

  -- 3. Tính tổng tiền mới từ shipment_items
  SELECT COALESCE(SUM(total_amount), 0) INTO v_total_amount 
  FROM public.shipment_items WHERE shipment_id = p_shipment_id;

  -- 4. Đảm bảo record customer_debt tồn tại (UPSERT)
  INSERT INTO public.customer_debt (tenant_id, customer_id, balance)
  VALUES (v_tenant, v_shipment.customer_id, 0)
  ON CONFLICT (customer_id, tenant_id) DO NOTHING;

  -- 5. Lấy nợ cũ đã ghi nhận của phiếu này (nếu có)
  SELECT amount INTO v_old_amount 
  FROM public.debt_transactions 
  WHERE shipment_id = p_shipment_id AND type = 'shipment';

  v_old_amount := COALESCE(v_old_amount, 0);
  v_delta := v_total_amount - v_old_amount;

  IF v_delta = 0 THEN
    RETURN; -- No change needed
  END IF;

  -- 6. Cập nhật bản chi tiết (debt_transactions)
  INSERT INTO public.debt_transactions (
    tenant_id, 
    customer_id, 
    shipment_id, 
    type, 
    amount, 
    notes,
    created_by
  ) VALUES (
    v_tenant,
    v_shipment.customer_id,
    p_shipment_id,
    'shipment',
    v_total_amount,
    'Tự động đồng bộ từ phiếu ' || (SELECT shipment_number FROM public.shipments WHERE id = p_shipment_id),
    auth.uid()
  )
  ON CONFLICT (shipment_id, type) DO UPDATE 
    SET amount = EXCLUDED.amount,
        notes = EXCLUDED.notes,
        created_at = now();

  -- 7. Cập nhật số dư tổng (customer_debt)
  UPDATE public.customer_debt 
  SET balance = balance + v_delta,
      updated_at = now()
  WHERE customer_id = v_shipment.customer_id AND tenant_id = v_tenant;

END;
$$;
