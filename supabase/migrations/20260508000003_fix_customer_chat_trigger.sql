-- Fix: trg_fn_create_customer_chat_participants used invalid enum value 'operations'
-- user_role enum only has: admin, manager, staff, viewer, driver, sale, customer, warehouse
-- Use p.role::text for safe comparison (same pattern as 20260504201000)

CREATE OR REPLACE FUNCTION public.trg_fn_create_customer_chat_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.entity_type <> 'customer' THEN
    RETURN NEW;
  END IF;

  -- Add admin + warehouse staff of the tenant (::text cast avoids enum literal error)
  INSERT INTO public.chat_room_participants (room_id, user_id, role)
  SELECT NEW.id, p.id, 'admin'
  FROM public.profiles p
  WHERE p.tenant_id = NEW.tenant_id
    AND p.role::text IN ('admin', 'warehouse')
  ON CONFLICT (room_id, user_id) DO NOTHING;

  -- Add customer's portal profile (profiles.customer_id = entity_id)
  INSERT INTO public.chat_room_participants (room_id, user_id, role)
  SELECT NEW.id, p.id, 'customer'
  FROM public.profiles p
  WHERE p.customer_id = NEW.entity_id
  ON CONFLICT (room_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
