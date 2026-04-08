-- Migration: Patch DELETE branch of trg_sync_shipment_debt
-- Fixes 2 remaining issues in migration 000016:
--
-- FIX A: Race condition — add FOR UPDATE lock on customer_debt before UPDATE
--        (INSERT/UPDATE branches already lock via sync_shipment_debt RPC)
--
-- FIX B: RETURNING...INTO only captures 1 row — use SUM instead to handle
--        edge cases where multiple debt_transactions share the same shipment_id

CREATE OR REPLACE FUNCTION trg_sync_shipment_debt()
RETURNS TRIGGER AS $$
DECLARE
  v_shipment_id UUID;
  v_customer_id UUID;
  v_tenant_id   UUID;
  v_old_amount  NUMERIC(14,2);
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.sync_shipment_debt(NEW.id);
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status IS DISTINCT FROM OLD.status
           OR NEW.shipment_date IS DISTINCT FROM OLD.shipment_date THEN
            PERFORM public.sync_shipment_debt(NEW.id);
        END IF;
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        v_shipment_id := OLD.id;
        v_customer_id := OLD.customer_id;
        v_tenant_id   := OLD.tenant_id;

        -- FIX B: SUM tất cả debt_transactions của shipment này trước khi xóa
        --        Tránh mất dữ liệu khi RETURNING...INTO chỉ lấy 1 dòng cuối
        SELECT COALESCE(SUM(amount), 0)
        INTO v_old_amount
        FROM public.debt_transactions
        WHERE shipment_id = v_shipment_id AND type = 'shipment';

        -- Xóa toàn bộ sau khi đã tổng hợp xong
        DELETE FROM public.debt_transactions
        WHERE shipment_id = v_shipment_id AND type = 'shipment';

        -- Chỉ cập nhật balance nếu thực sự có nợ được ghi nhận
        IF v_old_amount > 0 AND v_customer_id IS NOT NULL THEN
            -- FIX A: Lock row trước khi UPDATE để tránh race condition
            --        (giống cách sync_shipment_debt RPC đang làm)
            PERFORM 1 FROM public.customer_debt
            WHERE customer_id = v_customer_id AND tenant_id = v_tenant_id
            FOR UPDATE;

            UPDATE public.customer_debt
            SET balance    = GREATEST(0, balance - v_old_amount),
                updated_at = now()
            WHERE customer_id = v_customer_id AND tenant_id = v_tenant_id;
        END IF;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger binding không đổi — chỉ replace function
COMMENT ON TRIGGER trg_shipment_sync_debt ON public.shipments
  IS 'Tự động tính nợ khi tạo/sửa/xóa phiếu xuất kho (v3 - atomic delete).';
