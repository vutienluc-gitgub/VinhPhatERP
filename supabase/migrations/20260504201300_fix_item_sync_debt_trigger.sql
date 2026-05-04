-- Sửa lỗi trg_sync_item_price_change gọi hàm sync_shipment_debt không tồn tại
CREATE OR REPLACE FUNCTION trg_sync_item_price_change()
RETURNS TRIGGER AS $$
BEGIN
    -- After any change in quantity or price, tell the parent to re-sync
    IF TG_OP = 'DELETE' THEN
        PERFORM public.rpc_sync_shipment_debt(OLD.shipment_id);
        RETURN OLD;
    ELSE
        PERFORM public.rpc_sync_shipment_debt(NEW.shipment_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;
