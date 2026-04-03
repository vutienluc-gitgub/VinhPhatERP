-- ---------------------------------------------------------------------------
-- Deep analytics views for CEO-level Reports dashboard
-- ---------------------------------------------------------------------------
-- 1. v_debt_aging: phân nhóm công nợ theo tuổi nợ (aging buckets)
-- CEO cần biết nợ nào cần thu gấp, nợ nào đang lâu ngày
create or replace view v_debt_aging as
select o.id as order_id,
    o.order_number,
    o.customer_id,
    c.name as customer_name,
    o.order_date,
    o.delivery_date,
    o.total_amount,
    o.paid_amount,
    (o.total_amount - o.paid_amount) as balance_due,
    (current_date - o.order_date) as days_since_order,
    case
        when (current_date - o.order_date) <= 30 then '0-30'
        when (current_date - o.order_date) <= 60 then '31-60'
        when (current_date - o.order_date) <= 90 then '61-90'
        else '90+'
    end as aging_bucket
from orders o
    join customers c on c.id = o.customer_id
where o.status in ('confirmed', 'in_progress', 'completed')
    and (o.total_amount - o.paid_amount) > 0;
-- 2. v_production_efficiency: hiệu suất sản xuất theo công đoạn
-- CEO cần biết công đoạn nào đang là bottleneck, bao lâu mỗi stage
create or replace view v_production_efficiency as
select op.order_id,
    o.order_number,
    c.name as customer_name,
    op.stage,
    op.status as stage_status,
    op.planned_date,
    op.actual_date,
    case
        when op.actual_date is not null
        and op.planned_date is not null then op.actual_date - op.planned_date
        else null
    end as deviation_days,
    case
        when op.status = 'done'
        and op.actual_date is not null
        and op.planned_date is not null then op.actual_date - op.planned_date > 0
        else null
    end as is_late
from order_progress op
    join orders o on o.id = op.order_id
    join customers c on c.id = o.customer_id
where o.status in ('confirmed', 'in_progress', 'completed');
-- 3. v_revenue_by_fabric: doanh thu theo loại vải
-- CEO cần biết sản phẩm nào bán chạy, mang lại doanh thu cao nhất
create or replace view v_revenue_by_fabric as
select oi.fabric_type,
    oi.color_name,
    count(distinct oi.order_id) as order_count,
    sum(oi.quantity) as total_quantity,
    oi.unit,
    sum(oi.amount) as total_revenue,
    avg(oi.unit_price) as avg_unit_price
from order_items oi
    join orders o on o.id = oi.order_id
where o.status in ('confirmed', 'in_progress', 'completed')
group by oi.fabric_type,
    oi.color_name,
    oi.unit;
-- 4. v_monthly_revenue: doanh thu theo tháng (trendline cho CEO)
create or replace view v_monthly_revenue as
select to_char(o.order_date, 'YYYY-MM') as month,
    count(*) as order_count,
    sum(o.total_amount) as total_revenue,
    sum(o.paid_amount) as total_collected,
    sum(o.total_amount - o.paid_amount) as total_outstanding
from orders o
where o.status in ('confirmed', 'in_progress', 'completed')
group by to_char(o.order_date, 'YYYY-MM')
order by month desc;
-- 5. v_on_time_delivery: tỷ lệ giao hàng đúng hạn
create or replace view v_on_time_delivery as
select o.id as order_id,
    o.order_number,
    c.name as customer_name,
    o.delivery_date,
    o.status,
    case
        when o.status = 'completed'
        and o.delivery_date is not null then o.updated_at::date <= o.delivery_date
        when o.status in ('confirmed', 'in_progress')
        and o.delivery_date is not null then current_date <= o.delivery_date
        else null
    end as is_on_time
from orders o
    join customers c on c.id = o.customer_id
where o.delivery_date is not null
    and o.status in ('confirmed', 'in_progress', 'completed');
-- 6. v_inventory_demand: so sánh tồn kho vs nhu cầu đơn hàng đang chờ
create or replace view v_inventory_demand as
select oi.fabric_type,
    oi.color_name,
    sum(oi.quantity) as demanded_qty,
    oi.unit,
    coalesce(inv.available_rolls, 0) as available_rolls,
    coalesce(inv.available_length, 0) as available_length_m,
    coalesce(res.reserved_rolls, 0) as reserved_rolls,
    coalesce(res.reserved_length, 0) as reserved_length_m
from order_items oi
    join orders o on o.id = oi.order_id
    left join lateral (
        select count(*) as available_rolls,
            coalesce(sum(f.length_m), 0) as available_length
        from finished_fabric_rolls f
        where f.fabric_type = oi.fabric_type
            and f.status = 'in_stock'
            and f.reserved_for_order_id is null
            and (
                oi.color_name is null
                or f.color_name = oi.color_name
            )
    ) inv on true
    left join lateral (
        select count(*) as reserved_rolls,
            coalesce(sum(f.length_m), 0) as reserved_length
        from finished_fabric_rolls f
        where f.fabric_type = oi.fabric_type
            and f.status in ('in_stock', 'reserved')
            and f.reserved_for_order_id is not null
            and (
                oi.color_name is null
                or f.color_name = oi.color_name
            )
    ) res on true
where o.status in ('confirmed', 'in_progress')
group by oi.fabric_type,
    oi.color_name,
    oi.unit,
    inv.available_rolls,
    inv.available_length,
    res.reserved_rolls,
    res.reserved_length;
-- 7. v_payment_collection: phân tích tốc độ thu tiền theo phương thức
create or replace view v_payment_collection as
select to_char(p.payment_date, 'YYYY-MM') as month,
    p.payment_method,
    count(*) as payment_count,
    sum(p.amount) as total_collected
from payments p
group by to_char(p.payment_date, 'YYYY-MM'),
    p.payment_method
order by month desc,
    total_collected desc;