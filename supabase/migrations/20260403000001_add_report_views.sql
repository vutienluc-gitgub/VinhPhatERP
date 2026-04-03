-- ---------------------------------------------------------------------------
-- Report views for the Reports module dashboard
-- ---------------------------------------------------------------------------
-- v_overdue_orders: đơn hàng trễ hạn hoặc sắp đến hạn
-- Chỉ lấy đơn đang active (confirmed / in_progress) có delivery_date
create or replace view v_overdue_orders as
select o.id as order_id,
    o.order_number,
    c.name as customer_name,
    o.order_date,
    o.delivery_date,
    (current_date - o.delivery_date::date) as days_overdue,
    o.total_amount,
    o.paid_amount,
    (o.total_amount - o.paid_amount) as balance_due,
    o.status
from orders o
    join customers c on c.id = o.customer_id
where o.status in ('confirmed', 'in_progress')
    and o.delivery_date is not null;
-- v_debt_by_customer: công nợ tổng hợp theo khách hàng
-- Tương tự get_debt_summary() nhưng dạng view, dễ query + filter từ Supabase client
create or replace view v_debt_by_customer as
select o.customer_id,
    c.name as customer_name,
    coalesce(c.code, '') as customer_code,
    count(*) as total_orders,
    sum(o.total_amount) as total_amount,
    sum(o.paid_amount) as paid_amount,
    sum(o.total_amount - o.paid_amount) as balance_due
from orders o
    join customers c on c.id = o.customer_id
where o.status in ('confirmed', 'in_progress', 'completed')
group by o.customer_id,
    c.name,
    c.code
having sum(o.total_amount - o.paid_amount) > 0
order by balance_due desc;
-- Grant access to authenticated users via RLS on underlying tables
-- Views inherit RLS from base tables (orders, customers) which already have RLS enabled