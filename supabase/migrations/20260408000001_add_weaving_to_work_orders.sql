
-- Migration: Add Weaving Supplier and Unit Price to Work Orders (v2 - Fixed View)
-- Step 1: Add columns to work_orders
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_orders' AND column_name='supplier_id') THEN
        ALTER TABLE work_orders ADD COLUMN supplier_id UUID REFERENCES suppliers(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_orders' AND column_name='weaving_unit_price') THEN
        ALTER TABLE work_orders ADD COLUMN weaving_unit_price NUMERIC(15, 2) DEFAULT 0;
    END IF;
END $$;

-- Step 2: Update v_supplier_debt to include liability from Work Orders
-- Note: Refreshing the composite view for all supplier types (Yarn, Weaving)

DROP VIEW IF EXISTS v_supplier_debt CASCADE;

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
    -- Expenses typically represent payments to suppliers
    -- Note: 'expenses' table correctly has no 'status' column in this schema
    SELECT 
        supplier_id,
        SUM(amount) as total_paid_raw
    FROM expenses
    WHERE category IN ('weaving_cost', 'yarn_purchase', 'supplier_payment')
    AND supplier_id IS NOT NULL
    GROUP BY supplier_id
),
work_order_totals AS (
    -- Completed or In-progress work orders represent pending liability
    SELECT 
        supplier_id,
        SUM(COALESCE(actual_yield_m, target_quantity_m) * weaving_unit_price) as total_work_value
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
    
    -- Payments can come from 'paid_amount' in invoices OR from general 'expenses'
    -- To avoid double counting, we usually track general payments in expenses.
    -- However, the weaving_invoices has its own 'paid_amount'.
    COALESCE(wit.total_paid_on_invoice, 0) + COALESCE(et.total_paid_raw, 0) as total_paid,
    
    -- Balance Due
    (COALESCE(wit.total_invoiced, 0) + COALESCE(yrt.total_purchased, 0)) - 
    (COALESCE(wit.total_paid_on_invoice, 0) + COALESCE(et.total_paid_raw, 0)) as balance_due,
    
    -- Pending liability (not yet invoiced)
    COALESCE(wot.total_work_value, 0) as pending_work_value,
    
    -- Stats
    COALESCE(wit.invoice_count, 0) + COALESCE(yrt.receipt_count, 0) as document_count
FROM suppliers s
LEFT JOIN weaving_invoice_totals wit ON s.id = wit.supplier_id
LEFT JOIN yarn_receipt_totals yrt ON s.id = yrt.supplier_id
LEFT JOIN expense_totals et ON s.id = et.supplier_id
LEFT JOIN work_order_totals wot ON s.id = wot.supplier_id
WHERE s.category IN ('weaving', 'yarn')
  AND (
    wit.supplier_id IS NOT NULL OR 
    yrt.supplier_id IS NOT NULL OR 
    et.supplier_id IS NOT NULL OR 
    wot.supplier_id IS NOT NULL
  );

GRANT SELECT ON v_supplier_debt TO authenticated;
