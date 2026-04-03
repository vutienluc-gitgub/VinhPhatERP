-- Migration: Add expense tracking module (Thu Chi toàn diện)
-- Adds: payment_accounts, expenses tables, supplier debt view, cash flow RPC
/* ── 1. Enums ── */
create type account_type as enum ('cash', 'bank');
create type expense_category as enum (
    'supplier_payment',
    -- Chi trả nhà cung cấp
    'yarn_purchase',
    -- Mua sợi
    'weaving_cost',
    -- Chi phí dệt
    'dyeing_cost',
    -- Chi phí nhuộm
    'salary',
    -- Lương nhân viên
    'rent',
    -- Thuê mặt bằng
    'utilities',
    -- Điện, nước, internet
    'logistics',
    -- Vận chuyển, giao hàng
    'equipment',
    -- Thiết bị, bảo trì
    'other' -- Chi phí khác
);
/* ── 2. Payment Accounts (Tài khoản tiền) ── */
create table if not exists payment_accounts (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    type account_type not null default 'cash',
    bank_name text,
    account_number text,
    initial_balance numeric(18, 2) not null default 0,
    current_balance numeric(18, 2) not null default 0,
    status text not null default 'active' check (status in ('active', 'inactive')),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_payment_accounts_status on payment_accounts (status);
/* ── 3. Expenses (Phiếu chi) ── */
create table if not exists expenses (
    id uuid primary key default gen_random_uuid(),
    expense_number text not null unique,
    category expense_category not null default 'other',
    amount numeric(18, 2) not null check (amount > 0),
    expense_date date not null default current_date,
    account_id uuid references payment_accounts(id),
    supplier_id uuid references suppliers(id),
    description text not null,
    reference_number text,
    notes text,
    created_by uuid references profiles(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_expenses_date on expenses (expense_date desc);
create index if not exists idx_expenses_category on expenses (category);
create index if not exists idx_expenses_supplier on expenses (supplier_id);
create index if not exists idx_expenses_account on expenses (account_id);
/* ── 4. Add account_id to payments (optional link) ── */
alter table payments
add column if not exists account_id uuid references payment_accounts(id);
create index if not exists idx_payments_account on payments (account_id);
/* ── 5. Updated-at triggers ── */
create trigger trg_payment_accounts_updated_at before
update on payment_accounts for each row execute function set_updated_at();
create trigger trg_expenses_updated_at before
update on expenses for each row execute function set_updated_at();
/* ── 6. RLS ── */
alter table payment_accounts enable row level security;
alter table expenses enable row level security;
create policy "Authenticated read payment_accounts" on payment_accounts for
select to authenticated using (true);
create policy "Authenticated insert payment_accounts" on payment_accounts for
insert to authenticated with check (true);
create policy "Authenticated update payment_accounts" on payment_accounts for
update to authenticated using (true);
create policy "Authenticated delete payment_accounts" on payment_accounts for delete to authenticated using (true);
create policy "Authenticated read expenses" on expenses for
select to authenticated using (true);
create policy "Authenticated insert expenses" on expenses for
insert to authenticated with check (true);
create policy "Authenticated update expenses" on expenses for
update to authenticated using (true);
create policy "Authenticated delete expenses" on expenses for delete to authenticated using (true);
/* ── 7. Sync account balance trigger ── */
create or replace function sync_account_balance() returns trigger language plpgsql as $$
declare _account_id uuid;
_old_account_id uuid;
begin -- Determine which account to recalculate
if TG_OP = 'DELETE' then _account_id := old.account_id;
else _account_id := new.account_id;
end if;
-- Recalculate balance for the current account
if _account_id is not null then
update payment_accounts
set current_balance = initial_balance + coalesce(
        (
            select sum(amount)
            from payments
            where account_id = _account_id
        ),
        0
    ) - coalesce(
        (
            select sum(amount)
            from expenses
            where account_id = _account_id
        ),
        0
    )
where id = _account_id;
end if;
-- On UPDATE, also recalculate old account if it changed
if TG_OP = 'UPDATE' then _old_account_id := old.account_id;
if _old_account_id is distinct
from _account_id
    and _old_account_id is not null then
update payment_accounts
set current_balance = initial_balance + coalesce(
        (
            select sum(amount)
            from payments
            where account_id = _old_account_id
        ),
        0
    ) - coalesce(
        (
            select sum(amount)
            from expenses
            where account_id = _old_account_id
        ),
        0
    )
where id = _old_account_id;
end if;
end if;
return null;
end;
$$;
create trigger trg_expenses_sync_balance
after
insert
    or
update
    or delete on expenses for each row execute function sync_account_balance();
create trigger trg_payments_sync_balance
after
insert
    or
update
    or delete on payments for each row execute function sync_account_balance();
/* ── 8. Cash flow summary RPC ── */
create or replace function get_cash_flow_summary(
        p_from date default (current_date - interval '30 days')::date,
        p_to date default current_date
    ) returns table (
        period text,
        total_inflow numeric,
        total_outflow numeric,
        net_flow numeric,
        inflow_count bigint,
        outflow_count bigint
    ) language sql stable security definer as $$
select to_char(d.dt, 'YYYY-MM-DD') as period,
    coalesce(inf.total, 0) as total_inflow,
    coalesce(outf.total, 0) as total_outflow,
    coalesce(inf.total, 0) - coalesce(outf.total, 0) as net_flow,
    coalesce(inf.cnt, 0) as inflow_count,
    coalesce(outf.cnt, 0) as outflow_count
from generate_series(p_from, p_to, '1 day'::interval) as d(dt)
    left join (
        select payment_date as dt,
            sum(amount) as total,
            count(*) as cnt
        from payments
        where payment_date between p_from and p_to
        group by payment_date
    ) inf on inf.dt = d.dt::date
    left join (
        select expense_date as dt,
            sum(amount) as total,
            count(*) as cnt
        from expenses
        where expense_date between p_from and p_to
        group by expense_date
    ) outf on outf.dt = d.dt::date
order by d.dt;
$$;
grant execute on function get_cash_flow_summary(date, date) to authenticated;
/* ── 9. Supplier debt view ── */
create or replace view v_supplier_debt as
select s.id as supplier_id,
    s.name as supplier_name,
    coalesce(s.code, '') as supplier_code,
    coalesce(yr.total_amount, 0) as total_purchased,
    coalesce(ex.total_paid, 0) as total_paid,
    coalesce(yr.total_amount, 0) - coalesce(ex.total_paid, 0) as balance_due,
    coalesce(yr.receipt_count, 0) as receipt_count
from suppliers s
    left join (
        select supplier_id,
            sum(total_amount) as total_amount,
            count(*) as receipt_count
        from yarn_receipts
        where status = 'confirmed'
        group by supplier_id
    ) yr on yr.supplier_id = s.id
    left join (
        select supplier_id,
            sum(amount) as total_paid
        from expenses
        where supplier_id is not null
        group by supplier_id
    ) ex on ex.supplier_id = s.id
where coalesce(yr.total_amount, 0) - coalesce(ex.total_paid, 0) > 0
order by balance_due desc;
grant select on v_supplier_debt to authenticated;
/* ── 10. Monthly expense breakdown RPC ── */
create or replace function get_expense_by_category(
        p_from date default date_trunc('month', current_date)::date,
        p_to date default current_date
    ) returns table (
        category expense_category,
        total_amount numeric,
        expense_count bigint
    ) language sql stable security definer as $$
select e.category,
    sum(e.amount) as total_amount,
    count(*) as expense_count
from expenses e
where e.expense_date between p_from and p_to
group by e.category
order by total_amount desc;
$$;
grant execute on function get_expense_by_category(date, date) to authenticated;