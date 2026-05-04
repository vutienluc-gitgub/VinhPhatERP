-- Cập nhật trigger trg_sync_shipment_debt để gọi đúng tên hàm rpc_sync_shipment_debt
CREATE OR REPLACE FUNCTION trg_sync_shipment_debt()
RETURNS TRIGGER AS $$
DECLARE
    v_customer_id UUID;
    v_tenant_id   UUID;
    v_total       NUMERIC;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Chỉ đồng bộ nếu trạng thái là shipped/delivered/returned
        IF NEW.status IN ('shipped', 'delivered', 'returned') THEN
            PERFORM public.rpc_sync_shipment_debt(NEW.id);
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Nếu đổi trạng thái hoặc đổi tổng tiền/khách hàng
        IF (NEW.status IS DISTINCT FROM OLD.status) OR
           (NEW.shipping_cost IS DISTINCT FROM OLD.shipping_cost) OR
           (NEW.loading_fee IS DISTINCT FROM OLD.loading_fee) OR
           (NEW.customer_id IS DISTINCT FROM OLD.customer_id) THEN
            PERFORM public.rpc_sync_shipment_debt(NEW.id);
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        -- Vá lỗi: Lấy trực tiếp thông tin từ OLD thay vì gọi RPC 
        -- vì shipment đã bị xóa nên RPC không thể SELECT được nữa.
        IF OLD.status IN ('shipped', 'delivered', 'returned') THEN
            v_customer_id := OLD.customer_id;
            v_tenant_id   := OLD.tenant_id;
            
            -- Tính tổng tiền của shipment bị xoá
            SELECT COALESCE(SUM(amount), 0) INTO v_total
            FROM public.shipment_items
            WHERE shipment_id = OLD.id;

            v_total := v_total + COALESCE(OLD.shipping_cost, 0) + COALESCE(OLD.loading_fee, 0);

            -- Giảm công nợ (vì phiếu xuất bị xoá, công nợ khách hàng giảm đi)
            UPDATE public.customer_debt
            SET balance = balance - v_total,
                updated_at = now()
            WHERE customer_id = v_customer_id AND tenant_id = v_tenant_id;
            
            -- Thêm lịch sử giảm trừ công nợ do xoá phiếu xuất
            INSERT INTO public.customer_debt_history (
                tenant_id, customer_id, reference_id, reference_type, type,
                amount, balance_after, notes, created_by
            )
            VALUES (
                v_tenant_id, v_customer_id, OLD.id, 'shipment', 'adjustment',
                v_total, 
                (SELECT balance FROM public.customer_debt WHERE customer_id = v_customer_id AND tenant_id = v_tenant_id),
                'Xoá phiếu xuất ' || OLD.shipment_number,
                public.current_user_id()
            );
        END IF;
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
