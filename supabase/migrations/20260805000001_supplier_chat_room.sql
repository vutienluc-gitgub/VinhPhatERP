-- Admin/Purchasing ↔ Supplier direct chat
-- When a chat_room with entity_type='supplier' is created:
--   • Auto-add all admin/purchasing staff of the tenant as participants
--   • Auto-add the supplier's portal profile (if they have one) as participant

CREATE OR REPLACE FUNCTION public.trg_fn_create_supplier_chat_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only handle supplier entity rooms
  IF NEW.entity_type <> 'supplier' THEN
    RETURN NEW;
  END IF;

  -- Add admin + purchasing staff of the tenant
  INSERT INTO public.chat_room_participants (room_id, user_id, role)
  SELECT NEW.id, p.id, 'admin'
  FROM public.profiles p
  WHERE p.tenant_id = NEW.tenant_id
    AND p.role IN ('admin', 'manager', 'operations') -- We might add 'purchasing' if there is such a role, but standard roles are usually admin/manager/operations
  ON CONFLICT (room_id, user_id) DO NOTHING;

  -- Add supplier's portal profile (profiles.supplier_id = entity_id)
  INSERT INTO public.chat_room_participants (room_id, user_id, role)
  SELECT NEW.id, p.id, 'supplier'
  FROM public.profiles p
  WHERE p.supplier_id = NEW.entity_id::UUID
  ON CONFLICT (room_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_supplier_chat_participants ON public.chat_rooms;
CREATE TRIGGER trg_create_supplier_chat_participants
  AFTER INSERT ON public.chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_create_supplier_chat_participants();