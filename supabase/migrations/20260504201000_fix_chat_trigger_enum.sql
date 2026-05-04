-- Sửa lỗi user_role enum trong trigger chat_rooms
CREATE OR REPLACE FUNCTION public.trg_fn_create_chat_room_on_shipment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chat_rooms (tenant_id, entity_type, entity_id, status)
  VALUES (NEW.tenant_id, 'shipment', NEW.id, 'active')
  ON CONFLICT (tenant_id, entity_type, entity_id) DO NOTHING;

  -- Auto-add participants: admin role for all admins in tenant
  INSERT INTO public.chat_room_participants (room_id, user_id, role)
  SELECT r.id, p.id, 'admin'
  FROM public.chat_rooms r
  JOIN public.profiles p ON p.tenant_id = NEW.tenant_id AND p.role::text IN ('admin', 'warehouse')
  WHERE r.tenant_id = NEW.tenant_id
    AND r.entity_type = 'shipment'
    AND r.entity_id = NEW.id
  ON CONFLICT (room_id, user_id) DO NOTHING;

  -- Auto-add driver if assigned
  IF NEW.delivery_staff_id IS NOT NULL THEN
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    SELECT r.id, NEW.delivery_staff_id, 'driver'
    FROM public.chat_rooms r
    WHERE r.tenant_id = NEW.tenant_id
      AND r.entity_type = 'shipment'
      AND r.entity_id = NEW.id
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
