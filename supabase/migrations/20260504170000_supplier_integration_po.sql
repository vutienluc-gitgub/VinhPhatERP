-- 1. Bảng supplier_material_prices
CREATE TABLE IF NOT EXISTS supplier_material_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT (current_setting('app.current_tenant_id', true))::uuid,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  material_id VARCHAR NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  uom VARCHAR NOT NULL DEFAULT 'kg',
  moq NUMERIC(10,2) DEFAULT 0,
  lead_time_days INT DEFAULT 7,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_to DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(supplier_id, material_id, valid_from)
);

-- Trigger cho updated_at
DROP TRIGGER IF EXISTS update_supplier_material_prices_updated_at ON supplier_material_prices;
CREATE TRIGGER update_supplier_material_prices_updated_at
  BEFORE UPDATE ON supplier_material_prices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Policy
ALTER TABLE supplier_material_prices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Tenant isolation for supplier_material_prices" ON supplier_material_prices;
    CREATE POLICY "Tenant isolation for supplier_material_prices" ON supplier_material_prices
      FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
END $$;

-- 2. Cập nhật bảng suppliers
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(255) DEFAULT 'Net 30',
ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 0;

-- 3. Tạo View v_supplier_performance
DROP VIEW IF EXISTS v_supplier_performance CASCADE;
CREATE VIEW v_supplier_performance AS
SELECT 
    s.id AS supplier_id,
    s.tenant_id,
    COUNT(po.id) AS total_pos,
    COALESCE(SUM(po.total_amount), 0) AS total_spend,
    -- Tỷ lệ giao hàng đúng hạn (On-Time Delivery - OTD)
    CASE 
      WHEN COUNT(gr.id) = 0 THEN 0 
      ELSE ROUND((COUNT(gr.id) FILTER (WHERE gr.received_date <= po.expected_date) * 100.0 / COUNT(gr.id))::numeric, 2) 
    END AS on_time_rate,
    -- Thời gian giao hàng thực tế trung bình (ngày)
    CASE 
      WHEN COUNT(gr.id) = 0 THEN 0
      ELSE ROUND(AVG(gr.received_date - po.order_date)::numeric, 1)
    END AS avg_lead_time_days
FROM suppliers s
LEFT JOIN purchase_orders po ON po.supplier_id = s.id AND po.status IN ('approved', 'partial_received', 'completed')
LEFT JOIN goods_receipts gr ON gr.po_id = po.id
GROUP BY s.id, s.tenant_id;

-- 4. RPC function lấy thông tin giá NCC (rpc_get_supplier_price)
CREATE OR REPLACE FUNCTION rpc_get_supplier_price(
  p_supplier_id UUID,
  p_material_id VARCHAR
)
RETURNS TABLE (
  unit_price NUMERIC(15,2),
  uom VARCHAR,
  moq NUMERIC(10,2),
  lead_time_days INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    smp.unit_price, 
    smp.uom, 
    smp.moq, 
    smp.lead_time_days
  FROM supplier_material_prices smp
  WHERE smp.supplier_id = p_supplier_id 
    AND smp.material_id = p_material_id
    AND smp.is_active = true
    AND smp.valid_from <= CURRENT_DATE
    AND (smp.valid_to IS NULL OR smp.valid_to >= CURRENT_DATE)
    AND smp.tenant_id = (current_setting('app.current_tenant_id', true))::uuid
  ORDER BY smp.valid_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
