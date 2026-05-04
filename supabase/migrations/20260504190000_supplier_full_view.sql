-- Drop existing view
DROP VIEW IF EXISTS v_supplier_full CASCADE;

CREATE VIEW v_supplier_full AS
SELECT 
    s.*,
    COALESCE(p.total_pos, 0) AS total_pos,
    COALESCE(p.total_spend, 0) AS total_spend,
    COALESCE(p.on_time_rate, 0) AS on_time_rate,
    COALESCE(p.avg_lead_time_days, 0) AS avg_lead_time_days
FROM suppliers s
LEFT JOIN v_supplier_performance p ON p.supplier_id = s.id;
