-- Ensure function exists in public schema before granting
create or replace function public.update_supplier(
        p_id uuid,
        p_code text,
        p_name text,
        p_category supplier_category,
        p_phone text default null,
        p_email text default null,
        p_address text default null,
        p_tax_code text default null,
        p_contact_person text default null,
        p_notes text default null,
        p_status active_status default 'active'
    ) returns uuid language plpgsql security definer as $$
declare v_role user_role;
v_result uuid;
begin if auth.uid() is null then raise exception 'NOT_AUTHENTICATED';
end if;
select role into v_role
from profiles
where id = auth.uid();
if v_role is null
or v_role not in ('admin', 'manager', 'staff') then raise exception 'FORBIDDEN';
end if;
update suppliers
set code = p_code,
    name = p_name,
    category = p_category,
    phone = p_phone,
    email = p_email,
    address = p_address,
    tax_code = p_tax_code,
    contact_person = p_contact_person,
    notes = p_notes,
    status = p_status,
    updated_at = now()
where id = p_id
returning id into v_result;
if v_result is null then raise exception 'NOT_FOUND';
end if;
return v_result;
end;
$$;
-- Grant execute for update_supplier RPC
revoke all on function public.update_supplier(
    uuid,
    text,
    text,
    supplier_category,
    text,
    text,
    text,
    text,
    text,
    text,
    active_status
)
from public;
grant execute on function public.update_supplier(
        uuid,
        text,
        text,
        supplier_category,
        text,
        text,
        text,
        text,
        text,
        text,
        active_status
    ) to authenticated;
alter function public.update_supplier(
    uuid,
    text,
    text,
    supplier_category,
    text,
    text,
    text,
    text,
    text,
    text,
    active_status
)
set search_path = public;