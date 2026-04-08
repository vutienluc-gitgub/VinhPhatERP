-- Migration: Trigger to automatically sync shipment debt
-- Purpose: Real-time debt calculation when shipments or their items are records changed.

-- 1. Trigger function for shipments table
CREATE OR REPLACE FUNCTION trg_sync_shipment_debt()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if it's NOT preparing or status changed
    IF NEW.status != OLD.status OR NEW.shipment_date != OLD.shipment_date THEN
        PERFORM public.sync_shipment_debt(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger function for shipment_items table (re-sync parent debt)
CREATE OR REPLACE FUNCTION trg_sync_item_price_change()
RETURNS TRIGGER AS $$
BEGIN
    -- After any change in quantity or price, tell the parent to re-sync
    IF TG_OP = 'DELETE' THEN
        PERFORM public.sync_shipment_debt(OLD.shipment_id);
        RETURN OLD;
    ELSE
        PERFORM public.sync_shipment_debt(NEW.shipment_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Bind triggers
-- for shipments
DROP TRIGGER IF EXISTS trg_shipment_sync_debt ON public.shipments;
CREATE TRIGGER trg_shipment_sync_debt
  AFTER INSERT OR UPDATE OR DELETE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION trg_sync_shipment_debt();

-- for shipment_items
DROP TRIGGER IF EXISTS trg_item_sync_debt ON public.shipment_items;
CREATE TRIGGER trg_item_sync_debt
  AFTER INSERT OR UPDATE OR DELETE ON public.shipment_items
  FOR EACH ROW EXECUTE FUNCTION trg_sync_item_price_change();

-- 4. Comment
COMMENT ON TRIGGER trg_shipment_sync_debt ON public.shipments IS 'Tự động tính nợ khi đổi trạng thái phiếu xuất.';
COMMENT ON TRIGGER trg_item_sync_debt ON public.shipment_items IS 'Tự động tính lại nợ khi sửa giá/số lượng từng dòng hàng.';
