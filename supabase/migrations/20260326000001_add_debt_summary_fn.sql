-- ---------------------------------------------------------------------------
-- RPC function: aggregate debt summary grouped by customer (server-side)
-- ---------------------------------------------------------------------------
create or replace function get_debt_summary() returns table (
        customer_id uuid,
        customer_name text,
        customer_code text,
        total_ordered numeric,
        total_paid numeric,
        balance_due numeric,
        order_count bigint
    ) language sql stable security definer as $$
select o.customer_id,
    c.name as customer_name,
    coalesce(c.code, '') as customer_code,
    sum(o.total_amount) as total_ordered,
    sum(o.paid_amount) as total_paid,
    sum(o.total_amount - o.paid_amount) as balance_due,
    count(*) as order_count
from orders o
    join customers c on c.id = o.customer_id
where o.status in ('confirmed', 'in_progress', 'completed')
group by o.customer_id,
    c.name,
    c.code
having sum(o.total_amount - o.paid_amount) > 0
order by balance_due desc;
$$;
-- Grant execute to authenticated users
grant execute on function get_debt_summary() to authenticated;