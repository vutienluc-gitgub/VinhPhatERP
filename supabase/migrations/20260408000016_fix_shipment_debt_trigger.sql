-- Migration: Fix BUG 1+2 in shipment debt trigger
-- BUG 1: INSERT — OLD is NULL, so OLD.status comparison returns NULL → trigger never fires
-- BUG 2: DELETE — NEW is NULL, function crashes at NEW.id
--
-- Fix: Use TG_OP to branch INSERT / UPDATE / DELETE correctly.

-- 1. Replace trigger function for shipments table
CREATE OR REPLACE FUNCTION trg_sync_shipment_debt()
RETURNS TRIGGER AS $$
DECLARE
  v_shipment_id UUID;
  v_customer_id UUID;
  v_tenant_id   UUID;
  v_old_amount  NUMERIC(14,2);
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- New shipment: always sync (RPC handles preparing status internally)
        PERFORM public.sync_shipment_debt(NEW.id);
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Only sync when status or shipment_date actually changed
        IF NEW.status IS DISTINCT FROM OLD.status
           OR NEW.shipment_date IS DISTINCT FROM OLD.shipment_date THEN
            PERFORM public.sync_shipment_debt(NEW.id);
        END IF;
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        -- Shipment deleted: reverse any debt that was recorded
        v_shipment_id := OLD.id;
        v_customer_id := OLD.customer_id;
        v_tenant_id   := OLD.tenant_id;

        -- Remove the debt transaction and capture the amount
        DELETE FROM public.debt_transactions
        WHERE shipment_id = v_shipment_id AND type = 'shipment'
        RETURNING amount INTO v_old_amount;

        -- Subtract from customer balance if there was a recorded debt
        IF v_old_amount IS NOT NULL AND v_customer_id IS NOT NULL THEN
            UPDATE public.customer_debt
            SET balance = GREATEST(0, balance - v_old_amount),
                updated_at = now()
            WHERE customer_id = v_customer_id AND tenant_id = v_tenant_id;
        END IF;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-bind trigger (unchanged events, but function is now correct)
DROP TRIGGER IF EXISTS trg_shipment_sync_debt ON public.shipments;
CREATE TRIGGER trg_shipment_sync_debt
  AFTER INSERT OR UPDATE OR DELETE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION trg_sync_shipment_debt();

COMMENT ON TRIGGER trg_shipment_sync_debt ON public.shipments
  IS 'Tự động tính nợ khi tạo/sửa/xóa phiếu xuất kho.';
