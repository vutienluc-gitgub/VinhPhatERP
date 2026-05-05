-- Admin ↔ Customer direct chat
-- When a chat_room with entity_type='customer' is created:
--   • Auto-add all admin/operations staff of the tenant as participants
--   • Auto-add the customer's portal profile (if they have one) as participant

CREATE OR REPLACE FUNCTION public.trg_fn_create_customer_chat_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only handle customer entity rooms
  IF NEW.entity_type <> 'customer' THEN
    RETURN NEW;
  END IF;

  -- Add admin + operations staff of the tenant
  INSERT INTO public.chat_room_participants (room_id, user_id, role)
  SELECT NEW.id, p.id, 'admin'
  FROM public.profiles p
  WHERE p.tenant_id = NEW.tenant_id
    AND p.role IN ('admin', 'operations')
  ON CONFLICT (room_id, user_id) DO NOTHING;

  -- Add customer's portal profile (profiles.customer_id = entity_id)
  INSERT INTO public.chat_room_participants (room_id, user_id, role)
  SELECT NEW.id, p.id, 'customer'
  FROM public.profiles p
  WHERE p.customer_id = NEW.entity_id::UUID
  ON CONFLICT (room_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_customer_chat_participants ON public.chat_rooms;
CREATE TRIGGER trg_create_customer_chat_participants
  AFTER INSERT ON public.chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_create_customer_chat_participants();
