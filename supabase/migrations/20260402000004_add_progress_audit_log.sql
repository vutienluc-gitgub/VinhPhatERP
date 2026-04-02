-- Audit log for order_progress status changes
create table if not exists progress_audit_log (
    id uuid primary key default gen_random_uuid(),
    progress_id uuid not null references order_progress(id) on delete cascade,
    order_id uuid not null references orders(id) on delete cascade,
    stage production_stage not null,
    old_status stage_status,
    new_status stage_status not null,
    changed_by uuid references profiles(id),
    notes text,
    created_at timestamptz not null default now()
);
-- Index for fast lookups by order
create index if not exists idx_progress_audit_order on progress_audit_log(order_id);
create index if not exists idx_progress_audit_progress on progress_audit_log(progress_id);