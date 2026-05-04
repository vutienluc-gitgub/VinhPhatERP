-- 1. Create table supplier_categories
CREATE TABLE IF NOT EXISTS supplier_categories (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policy for supplier_categories (Public read-only)
ALTER TABLE supplier_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow read access to all users" ON supplier_categories;
    CREATE POLICY "Allow read access to all users" ON supplier_categories
      FOR SELECT USING (true);
END $$;

-- 2. Seed data
INSERT INTO supplier_categories (code, name) VALUES 
('YARN', 'Sợi & Xơ'),
('CHEMICAL', 'Hóa chất & Phụ trợ'),
('GREIGE', 'Vải mộc (Dệt / Đan)'),
('FINISHED_FABRIC', 'Vải thành phẩm'),
('TRIM', 'Phụ liệu'),
('OUTSOURCING', 'Gia công (May / Nhuộm)'),
('SERVICE', 'Dịch vụ & Vật tư tiêu hao'),
('OTHER', 'Khác')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- 3. Drop dependent views first
DROP VIEW IF EXISTS v_supplier_debt CASCADE;
DROP VIEW IF EXISTS v_supplier_full CASCADE;

-- 4. Change suppliers category column type
ALTER TABLE suppliers ALTER COLUMN category DROP DEFAULT;
ALTER TABLE suppliers ALTER COLUMN category TYPE VARCHAR(50) USING category::text;

-- 5. Update existing suppliers to new categories
UPDATE suppliers SET category = 'YARN' WHERE category = 'yarn';
UPDATE suppliers SET category = 'CHEMICAL' WHERE category = 'dye';
UPDATE suppliers SET category = 'GREIGE' WHERE category = 'weaving';
UPDATE suppliers SET category = 'TRIM' WHERE category = 'accessories';
UPDATE suppliers SET category = 'OTHER' WHERE category = 'other' OR category IS NULL;

-- Set default back
ALTER TABLE suppliers ALTER COLUMN category SET DEFAULT 'OTHER';

-- Optional: add foreign key
-- ALTER TABLE suppliers ADD CONSTRAINT fk_supplier_category FOREIGN KEY (category) REFERENCES supplier_categories(code);

-- 6. Recreate v_supplier_full
CREATE VIEW v_supplier_full AS
SELECT 
    s.*,
    sc.name AS category_name,
    COALESCE(p.total_pos, 0) AS total_pos,
    COALESCE(p.total_spend, 0) AS total_spend,
    COALESCE(p.on_time_rate, 0) AS on_time_rate,
    COALESCE(p.avg_lead_time_days, 0) AS avg_lead_time_days
FROM suppliers s
LEFT JOIN supplier_categories sc ON s.category = sc.code
LEFT JOIN v_supplier_performance p ON p.supplier_id = s.id;

ALTER VIEW v_supplier_full SET (security_invoker = true);

-- 7. Recreate v_supplier_debt (from 20260408000001_add_weaving_to_work_orders.sql)
CREATE OR REPLACE VIEW v_supplier_debt AS
WITH weaving_invoice_totals AS (
    SELECT 
        supplier_id,
        COUNT(id) as invoice_count,
        SUM(total_amount) as total_invoiced,
        SUM(paid_amount) as total_paid_on_invoice
    FROM weaving_invoices
    WHERE status IN ('confirmed', 'paid')
    GROUP BY supplier_id
),
yarn_receipt_totals AS (
    SELECT 
        supplier_id,
        COUNT(id) as receipt_count,
        SUM(total_amount) as total_purchased
    FROM yarn_receipts
    WHERE status = 'confirmed'
    GROUP BY supplier_id
),
expense_totals AS (
    SELECT 
        supplier_id,
        SUM(amount) as total_paid_raw
    FROM expenses
    WHERE category IN ('weaving_cost', 'yarn_purchase', 'supplier_payment')
    AND supplier_id IS NOT NULL
    GROUP BY supplier_id
),
work_order_totals AS (
    SELECT 
        supplier_id,
        SUM(COALESCE(actual_yield_m, target_quantity) * weaving_unit_price) as total_work_value
    FROM work_orders
    WHERE status IN ('in_progress', 'completed')
    AND supplier_id IS NOT NULL
    GROUP BY supplier_id
)
SELECT 
    s.id as supplier_id,
    s.code as supplier_code,
    s.name as supplier_name,
    s.category as supplier_category,
    
    -- Financials
    COALESCE(wit.total_invoiced, 0) + COALESCE(yrt.total_purchased, 0) as total_purchased,
    COALESCE(wit.total_paid_on_invoice, 0) + COALESCE(et.total_paid_raw, 0) as total_paid,
    (COALESCE(wit.total_invoiced, 0) + COALESCE(yrt.total_purchased, 0)) - 
    (COALESCE(wit.total_paid_on_invoice, 0) + COALESCE(et.total_paid_raw, 0)) as balance_due,
    COALESCE(wot.total_work_value, 0) as pending_work_value,
    COALESCE(wit.invoice_count, 0) + COALESCE(yrt.receipt_count, 0) as document_count
FROM suppliers s
LEFT JOIN weaving_invoice_totals wit ON s.id = wit.supplier_id
LEFT JOIN yarn_receipt_totals yrt ON s.id = yrt.supplier_id
LEFT JOIN expense_totals et ON s.id = et.supplier_id
LEFT JOIN work_order_totals wot ON s.id = wot.supplier_id
WHERE s.category IN ('GREIGE', 'YARN')
  AND (
    wit.supplier_id IS NOT NULL OR 
    yrt.supplier_id IS NOT NULL OR 
    et.supplier_id IS NOT NULL OR 
    wot.supplier_id IS NOT NULL
  );

GRANT SELECT ON v_supplier_debt TO authenticated;
ALTER VIEW v_supplier_debt SET (security_invoker = true);
