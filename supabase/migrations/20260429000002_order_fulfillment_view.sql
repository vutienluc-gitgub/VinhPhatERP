-- ============================================================================
-- Migration: Order Fulfillment View
-- Mục đích: Tổng hợp tỉ lệ hoàn thành đơn hàng từ Work Order actual_yield_m
-- ============================================================================

CREATE OR REPLACE VIEW v_order_fulfillment AS
SELECT
  o.id AS order_id,
  o.order_number,
  o.status AS order_status,
  o.order_date,
  o.delivery_date,
  c.name AS customer_name,

  -- Tổng số lượng đặt hàng (từ order_items)
  COALESCE(oi.total_ordered_qty, 0) AS total_ordered_qty,
  COALESCE(oi.total_amount, 0) AS total_amount,

  -- Tổng hợp từ work_orders
  COALESCE(wo_agg.wo_count, 0) AS wo_count,
  COALESCE(wo_agg.wo_completed, 0) AS wo_completed,
  COALESCE(wo_agg.total_target_m, 0) AS total_target_m,
  COALESCE(wo_agg.total_produced_m, 0) AS total_produced_m,

  -- Tỉ lệ hoàn thành sản xuất (%)
  CASE
    WHEN COALESCE(wo_agg.total_target_m, 0) > 0
    THEN ROUND(COALESCE(wo_agg.total_produced_m, 0) / wo_agg.total_target_m * 100, 1)
    ELSE 0
  END AS fulfillment_pct,

  -- Tiến độ stages (từ order_progress)
  COALESCE(op_agg.total_stages, 0) AS total_stages,
  COALESCE(op_agg.completed_stages, 0) AS completed_stages,

  -- Trạng thái giao hàng
  CASE
    WHEN o.delivery_date IS NOT NULL AND o.delivery_date < CURRENT_DATE
         AND o.status NOT IN ('completed', 'cancelled')
    THEN true
    ELSE false
  END AS is_overdue

FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
LEFT JOIN (
  SELECT
    order_id,
    SUM(quantity) AS total_ordered_qty,
    SUM(COALESCE(amount, quantity * unit_price)) AS total_amount
  FROM order_items
  GROUP BY order_id
) oi ON oi.order_id = o.id
LEFT JOIN (
  SELECT
    order_id,
    COUNT(*)::int AS wo_count,
    COUNT(*) FILTER (WHERE status = 'completed')::int AS wo_completed,
    SUM(target_quantity) AS total_target_m,
    SUM(COALESCE(actual_yield_m, 0)) AS total_produced_m
  FROM work_orders
  WHERE order_id IS NOT NULL
  GROUP BY order_id
) wo_agg ON wo_agg.order_id = o.id
LEFT JOIN (
  SELECT
    order_id,
    COUNT(*)::int AS total_stages,
    COUNT(*) FILTER (WHERE status = 'done')::int AS completed_stages
  FROM order_progress
  WHERE order_id IS NOT NULL
  GROUP BY order_id
) op_agg ON op_agg.order_id = o.id
WHERE o.status NOT IN ('draft', 'cancelled');
