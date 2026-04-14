-- Migration to enable Realtime for Accounts Receivable

-- Mở khóa bảng để Supabase ghi nhận biến động vào Write-Ahead Log (WAL)
ALTER PUBLICATION supabase_realtime ADD TABLE customer_debt;
ALTER PUBLICATION supabase_realtime ADD TABLE debt_transactions;

-- Tạo helper trigger function (Optionally, nếu muốn custom logic trước khi emit WAL)
CREATE OR REPLACE FUNCTION trigger_broadcast_receivable()
RETURNS TRIGGER AS $$
BEGIN
  -- Thực chất Supabase Realtime sẽ quét schema publication tự động
  -- Trigger này đóng vai trò tuân thủ chuẩn nếu bạn muốn ép cập nhật `updated_at`
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn trigger nếu bảng customer_debt có updated_at
-- DROP TRIGGER IF EXISTS on_receivable_update ON customer_debt;
-- CREATE TRIGGER on_receivable_update
--   BEFORE UPDATE ON customer_debt
--   FOR EACH ROW EXECUTE FUNCTION trigger_broadcast_receivable();
