-- Create employees table
create table if not exists public.employees (
    id uuid default gen_random_uuid() primary key,
    code text not null unique,
    name text not null,
    phone text,
    role text not null check (role in ('admin', 'sales', 'warehouse')),
    status text not null default 'active' check (status in ('active', 'inactive')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indices for filtering
create index if not exists employees_role_idx on public.employees(role);
create index if not exists employees_status_idx on public.employees(status);

-- Enable RLS
alter table public.employees enable row level security;

-- Setup policies (standard authenticated read/write for now)
create policy "Enable full access for authenticated users" on public.employees
    for all using (auth.role() = 'authenticated');

-- Add employee_id to shipments table (optional reference)
alter table public.shipments 
add column if not exists employee_id uuid references public.employees(id);

create index if not exists shipments_employee_id_idx on public.shipments(employee_id);
