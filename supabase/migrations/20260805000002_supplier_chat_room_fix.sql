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

  -- Add admin + manager staff of the tenant
  INSERT INTO public.chat_room_participants (room_id, user_id, role)
  SELECT NEW.id, p.id, 'admin'
  FROM public.profiles p
  WHERE p.tenant_id = NEW.tenant_id
    AND p.role::text IN ('admin', 'manager', 'operations') 
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