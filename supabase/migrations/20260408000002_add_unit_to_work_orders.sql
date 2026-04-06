
-- Migration: Add Unit to Work Orders
-- Step 1: Add target_unit column to work_orders
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_orders' AND column_name='target_unit') THEN
        ALTER TABLE work_orders ADD COLUMN target_unit TEXT DEFAULT 'm';
    END IF;
END $$;

-- Step 2: Create a view for standard units available in the system
-- This fulfills the "units already in database" requirement by aggregating unique units used across catalogs
CREATE OR REPLACE VIEW v_available_units AS
SELECT DISTINCT unit FROM (
    SELECT unit FROM fabric_catalogs
    UNION
    SELECT unit FROM yarn_catalogs
    UNION
    SELECT unit FROM order_items
    UNION
    SELECT unit FROM yarn_receipt_items
    UNION
    SELECT 'm' as unit
    UNION
    SELECT 'kg' as unit
    UNION
    SELECT 'cuộn' as unit
) t
WHERE unit IS NOT NULL AND unit <> ''
ORDER BY unit;

GRANT SELECT ON v_available_units TO authenticated;
