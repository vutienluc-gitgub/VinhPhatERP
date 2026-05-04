-- Fix: v_supplier_debt does not include finished fabric purchased commercially.
-- This migration adds finished_fabric_purchase_totals CTE and expands the category filter.

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
),
-- NEW: Finished fabric purchased commercially (has supplier_id + purchase_price)
finished_fabric_purchase_totals AS (
    SELECT 
        supplier_id,
        COUNT(id) as purchase_roll_count,
        SUM(COALESCE(purchase_price, 0) * COALESCE(weight_kg, 0)) as total_fabric_purchased
    FROM finished_fabric_rolls
    WHERE supplier_id IS NOT NULL
      AND purchase_price IS NOT NULL
      AND purchase_price > 0
    GROUP BY supplier_id
)
SELECT 
    s.id as supplier_id,
    s.code as supplier_code,
    s.name as supplier_name,
    s.category as supplier_category,
    
    -- Financials: include finished fabric purchases
    COALESCE(wit.total_invoiced, 0) 
      + COALESCE(yrt.total_purchased, 0) 
      + COALESCE(ffpt.total_fabric_purchased, 0) as total_purchased,
    COALESCE(wit.total_paid_on_invoice, 0) 
      + COALESCE(et.total_paid_raw, 0) as total_paid,
    (COALESCE(wit.total_invoiced, 0) + COALESCE(yrt.total_purchased, 0) + COALESCE(ffpt.total_fabric_purchased, 0)) - 
    (COALESCE(wit.total_paid_on_invoice, 0) + COALESCE(et.total_paid_raw, 0)) as balance_due,
    COALESCE(wot.total_work_value, 0) as pending_work_value,
    COALESCE(wit.invoice_count, 0) 
      + COALESCE(yrt.receipt_count, 0) 
      + COALESCE(ffpt.purchase_roll_count, 0) as document_count
FROM suppliers s
LEFT JOIN weaving_invoice_totals wit ON s.id = wit.supplier_id
LEFT JOIN yarn_receipt_totals yrt ON s.id = yrt.supplier_id
LEFT JOIN expense_totals et ON s.id = et.supplier_id
LEFT JOIN work_order_totals wot ON s.id = wot.supplier_id
LEFT JOIN finished_fabric_purchase_totals ffpt ON s.id = ffpt.supplier_id
WHERE (
    wit.supplier_id IS NOT NULL OR 
    yrt.supplier_id IS NOT NULL OR 
    et.supplier_id IS NOT NULL OR 
    wot.supplier_id IS NOT NULL OR
    ffpt.supplier_id IS NOT NULL
);

GRANT SELECT ON v_supplier_debt TO authenticated;
ALTER VIEW v_supplier_debt SET (security_invoker = true);
