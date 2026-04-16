alter table public.shipments drop constraint if exists shipments_delivery_staff_id_fkey;
alter table public.shipments add constraint shipments_delivery_staff_id_fkey foreign key (delivery_staff_id) references public.employees(id);
