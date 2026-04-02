do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'customer_source'
      and e.enumlabel = 'facebook'
  ) then
    alter type customer_source add value 'facebook' after 'zalo';
  end if;
end $$;