-- =====================================================================================
-- Nâng cấp chuẩn SaaS: Tự động ghi Audit Log khi Nhập Vải Mộc (Inbound Receipt)
-- =====================================================================================

-- 1. Hàm Trigger: Tự động ghi nhận biến động tăng tồn kho vào inventory_adjustments
CREATE OR REPLACE FUNCTION trg_log_inbound_raw_fabric()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Chỉ ghi log khi cuộn vải được tạo mới với trạng thái in_stock
  IF NEW.status = 'in_stock' THEN
    INSERT INTO public.inventory_adjustments (
      tenant_id,
      adjustment_date,
      item_type,
      reference_id,
      adjustment_type,
      quantity_delta,
      reason,
      notes,
      created_by
    ) VALUES (
      NEW.tenant_id,
      CURRENT_DATE,
      'raw_fabric',
      NEW.id,
      'increase',
      NEW.weight_kg,
      'INBOUND_RECEIPT',
      'Tự động ghi nhận nhập kho mộc từ phiếu gia công.',
      -- User ID có thể lấy từ auth.uid() nếu thao tác qua API, 
      -- nhưng vì RPC SECURITY DEFINER có thể mất context, ta ưu tiên auth.uid() hoặc null
      auth.uid() 
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Gắn Trigger vào bảng raw_fabric_rolls
DROP TRIGGER IF EXISTS trg_audit_raw_fabric_inbound ON public.raw_fabric_rolls;
CREATE TRIGGER trg_audit_raw_fabric_inbound
  AFTER INSERT ON public.raw_fabric_rolls
  FOR EACH ROW
  EXECUTE FUNCTION trg_log_inbound_raw_fabric();
