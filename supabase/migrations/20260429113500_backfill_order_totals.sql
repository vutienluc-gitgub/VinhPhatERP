-- =============================================================================
-- Backfill: Recalculate total_amount for ALL orders from their items.
-- Orders whose items were edited while rpc_update_order_with_items
-- was missing the total_amount update will now be corrected.
-- =============================================================================

UPDATE orders o
SET total_amount = sub.calc_total
FROM (
  SELECT order_id, COALESCE(SUM(quantity * unit_price), 0) AS calc_total
  FROM order_items
  GROUP BY order_id
) sub
WHERE o.id = sub.order_id
  AND o.total_amount <> sub.calc_total;
