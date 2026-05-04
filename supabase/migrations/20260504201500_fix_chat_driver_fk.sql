-- Sửa lỗi Foreign Key trong chat_room_participants (driver user_id mapping)
CREATE OR REPLACE FUNCTION public.trg_fn_create_chat_room_on_shipment()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Tạo chat room
  INSERT INTO public.chat_rooms (tenant_id, entity_type, entity_id, status)
  VALUES (NEW.tenant_id, 'shipment', NEW.id, 'active')
  ON CONFLICT (tenant_id, entity_type, entity_id) DO NOTHING;

  -- 2. Tự động thêm admin & warehouse staff vào nhóm chat
  INSERT INTO public.chat_room_participants (room_id, user_id, role)
  SELECT r.id, p.id, 'admin'
  FROM public.chat_rooms r
  JOIN public.profiles p ON p.tenant_id = NEW.tenant_id AND p.role::text IN ('admin', 'warehouse')
  WHERE r.tenant_id = NEW.tenant_id
    AND r.entity_type = 'shipment'
    AND r.entity_id = NEW.id
  ON CONFLICT (room_id, user_id) DO NOTHING;

  -- 3. Tự động thêm tài xế (nếu tài xế đó có tài khoản người dùng)
  IF NEW.delivery_staff_id IS NOT NULL THEN
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    SELECT r.id, p.id, 'driver'
    FROM public.chat_rooms r
    JOIN public.profiles p ON p.employee_id = NEW.delivery_staff_id
    WHERE r.tenant_id = NEW.tenant_id
      AND r.entity_type = 'shipment'
      AND r.entity_id = NEW.id
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
