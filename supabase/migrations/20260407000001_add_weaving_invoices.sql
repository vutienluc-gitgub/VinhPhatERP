-- =============================================================================
-- Migration: Phiếu gia công dệt (Weaving Invoices)
-- Flow: Tạo phiếu → Nhập cuộn vải (bước riêng) → Xác nhận → auto insert raw_fabric_rolls + công nợ
-- =============================================================================

/* ── 1. Bảng phiếu gia công (header) ── */

create table if not exists weaving_invoices (
  id              uuid        primary key default gen_random_uuid(),
  invoice_number  text        not null unique,
  supplier_id     uuid        not null references suppliers(id),
  invoice_date    date        not null default current_date,
  fabric_type     text        not null,
  unit_price_per_kg numeric(18,2) not null default 0 check (unit_price_per_kg >= 0),
  total_weight_kg numeric(10,3) not null default 0,
  total_amount    numeric(18,2) not null default 0,
  paid_amount     numeric(18,2) not null default 0 check (paid_amount >= 0),
  status          text        not null default 'draft'
                  check (status in ('draft', 'confirmed', 'paid')),
  notes           text,
  created_by      uuid        references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_weaving_invoices_supplier on weaving_invoices (supplier_id);
create index if not exists idx_weaving_invoices_status   on weaving_invoices (status);
create index if not exists idx_weaving_invoices_date     on weaving_invoices (invoice_date desc);

/* ── 2. Bảng cuộn vải trong phiếu gia công (line items) ── */

create table if not exists weaving_invoice_rolls (
  id                  uuid        primary key default gen_random_uuid(),
  invoice_id          uuid        not null references weaving_invoices(id) on delete cascade,
  roll_number         text        not null,
  weight_kg           numeric(10,3) not null check (weight_kg > 0),
  length_m            numeric(10,3),
  quality_grade       char(1)     check (quality_grade in ('A','B','C')),
  warehouse_location  text,
  lot_number          text,
  notes               text,
  -- populated after invoice confirmed → roll inserted to raw_fabric_rolls
  raw_fabric_roll_id  uuid        references raw_fabric_rolls(id),
  sort_order          int         not null default 0,
  created_at          timestamptz not null default now(),
  unique (invoice_id, roll_number)
);

create index if not exists idx_weaving_inv_rolls_invoice on weaving_invoice_rolls (invoice_id);

/* ── 3. Trigger: updated_at ── */

create or replace function set_updated_at()
  returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Avoid duplicate trigger
drop trigger if exists trg_weaving_invoices_updated_at on weaving_invoices;
create trigger trg_weaving_invoices_updated_at
  before update on weaving_invoices
  for each row execute function set_updated_at();

/* ── 4. RPC: Xác nhận phiếu gia công ── */
-- Khi confirm:
--   a) Recalculate total_weight_kg và total_amount từ rolls
--   b) Bulk insert vào raw_fabric_rolls với weaving_partner_id = supplier_id
--   c) Ghi raw_fabric_roll_id ngược lại vào weaving_invoice_rolls
--   d) Đổi status thành 'confirmed'

create or replace function confirm_weaving_invoice(p_invoice_id uuid)
  returns void language plpgsql security definer as $$
declare
  v_invoice   weaving_invoices%rowtype;
  v_roll      weaving_invoice_rolls%rowtype;
  v_roll_id   uuid;
  v_total_kg  numeric := 0;
begin
  -- Lock invoice
  select * into v_invoice
  from weaving_invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'INVOICE_NOT_FOUND';
  end if;
  if v_invoice.status != 'draft' then
    raise exception 'INVOICE_NOT_DRAFT: current status is %', v_invoice.status;
  end if;

  -- Process each roll
  for v_roll in
    select * from weaving_invoice_rolls
    where invoice_id = p_invoice_id
    order by sort_order
  loop
    -- Insert into raw_fabric_rolls
    insert into raw_fabric_rolls (
      roll_number, fabric_type, weight_kg, length_m,
      quality_grade, warehouse_location, lot_number,
      status, weaving_partner_id, notes, production_date
    ) values (
      v_roll.roll_number,
      v_invoice.fabric_type,
      v_roll.weight_kg,
      v_roll.length_m,
      v_roll.quality_grade,
      v_roll.warehouse_location,
      v_roll.lot_number,
      'in_stock',
      v_invoice.supplier_id,
      v_roll.notes,
      v_invoice.invoice_date
    )
    returning id into v_roll_id;

    -- Update line item với roll id
    update weaving_invoice_rolls
    set raw_fabric_roll_id = v_roll_id
    where id = v_roll.id;

    v_total_kg := v_total_kg + v_roll.weight_kg;
  end loop;

  -- Recalculate totals and confirm
  update weaving_invoices
  set
    total_weight_kg = v_total_kg,
    total_amount    = v_total_kg * unit_price_per_kg,
    status          = 'confirmed',
    updated_at      = now()
  where id = p_invoice_id;
end;
$$;

grant execute on function confirm_weaving_invoice(uuid) to authenticated;

/* ── 5. View: supplier debt including weaving invoices ── */

create or replace view v_supplier_debt as
select
  s.id                as supplier_id,
  s.name              as supplier_name,
  coalesce(s.code,'') as supplier_code,
  s.category,
  sum(wi.total_amount)                        as total_invoiced,
  sum(wi.paid_amount)                         as total_paid,
  sum(wi.total_amount - wi.paid_amount)       as balance_due,
  count(*)                                    as invoice_count
from weaving_invoices wi
join suppliers s on s.id = wi.supplier_id
where wi.status in ('confirmed', 'paid')
  and (wi.total_amount - wi.paid_amount) > 0
group by s.id, s.name, s.code, s.category
having sum(wi.total_amount - wi.paid_amount) > 0
order by balance_due desc;

-- Grant read access
grant select on v_supplier_debt to authenticated;

/* ── 6. Next invoice number helper ── */

create or replace function next_weaving_invoice_number()
  returns text language sql stable security definer as $$
select
  'GC' ||
  to_char(now(), 'YYMM') || '-' ||
  lpad(
    coalesce(
      (
        select (regexp_replace(invoice_number, '^GC\d{4}-', ''))::int + 1
        from weaving_invoices
        where invoice_number like 'GC' || to_char(now(),'YYMM') || '-%'
        order by invoice_number desc
        limit 1
      ),
      0
    )::text,
    3, '0'
  );
$$;

grant execute on function next_weaving_invoice_number() to authenticated;
