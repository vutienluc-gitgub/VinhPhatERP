-- ==========================================
-- Migration: Chat System — Triggers, Auto-close, Rate Limiting, Storage
-- ==========================================
-- Các cấu hình Supabase backend còn thiếu cho Chat module.
-- REVIEW TRƯỚC KHI CHẠY: supabase db push

-- ──────────────────────────────────────────
-- 1. ALTER shipments: Thêm cột last_chat_at
-- ──────────────────────────────────────────
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS last_chat_at TIMESTAMPTZ;

COMMENT ON COLUMN public.shipments.last_chat_at 
IS 'Timestamp tin nhắn cuối cùng trong room chat, dùng cho badge unread trên dashboard';

-- ──────────────────────────────────────────
-- 2. Trigger: Tự động tạo chat room khi shipment được tạo
-- ──────────────────────────────────────────
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
  JOIN public.profiles p ON p.tenant_id = NEW.tenant_id AND p.role IN ('admin', 'operations')
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

DROP TRIGGER IF EXISTS trg_create_chat_room_on_shipment ON public.shipments;
CREATE TRIGGER trg_create_chat_room_on_shipment
  AFTER INSERT ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_create_chat_room_on_shipment();

-- ──────────────────────────────────────────
-- 3. Trigger: Tự động đóng chat room khi shipment delivered/returned
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_fn_close_chat_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('delivered', 'returned') AND OLD.status NOT IN ('delivered', 'returned') THEN
    UPDATE public.chat_rooms
    SET status = 'closed', updated_at = NOW()
    WHERE entity_type = 'shipment'
      AND entity_id = NEW.id
      AND tenant_id = NEW.tenant_id
      AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_close_chat_on_delivery ON public.shipments;
CREATE TRIGGER trg_close_chat_on_delivery
  AFTER UPDATE OF status ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_close_chat_on_delivery();

-- ──────────────────────────────────────────
-- 4. Trigger: Cập nhật shipments.last_chat_at khi có tin nhắn mới
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_fn_update_shipment_last_chat()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.shipments s
  SET last_chat_at = NOW()
  FROM public.chat_rooms r
  WHERE r.id = NEW.room_id
    AND r.entity_type = 'shipment'
    AND r.entity_id = s.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_shipment_last_chat ON public.chat_messages;
CREATE TRIGGER trg_update_shipment_last_chat
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_update_shipment_last_chat();

-- ──────────────────────────────────────────
-- 5. Rate Limiting: Chống spam (max 5 tin/10 giây per user)
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_fn_chat_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.chat_messages
  WHERE sender_id = NEW.sender_id
    AND room_id = NEW.room_id
    AND created_at > NOW() - INTERVAL '10 seconds';

  IF v_count >= 5 THEN
    RAISE EXCEPTION 'rate_limit_exceeded: Qua nhieu tin nhan, vui long doi'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_rate_limit ON public.chat_messages;
CREATE TRIGGER trg_chat_rate_limit
  BEFORE INSERT ON public.chat_messages
  FOR EACH ROW
  WHEN (NEW.sender_id IS NOT NULL)
  EXECUTE FUNCTION public.trg_fn_chat_rate_limit();

-- ──────────────────────────────────────────
-- 6. UNIQUE constraint trên client_id (Idempotent upsert)
-- ──────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_chat_messages_client_id_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_chat_messages_client_id_unique 
    ON public.chat_messages(client_id);
  END IF;
END $$;

-- ──────────────────────────────────────────
-- 7. Storage Bucket: chat_attachments
-- ──────────────────────────────────────────
-- LƯU Ý: Chạy trên Supabase Dashboard > Storage > New Bucket:
--   Name: chat_attachments
--   Public: false
--   Allowed MIME types: image/jpeg, image/png, image/webp, application/pdf
--   File size limit: 5MB (5242880 bytes)
-- 
-- Hoặc dùng SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat_attachments',
  'chat_attachments',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS: Tenant isolation
CREATE POLICY "Tenant can read own chat attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat_attachments'
  AND (storage.foldername(name))[1] = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')
);

CREATE POLICY "Tenant can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat_attachments'
  AND (storage.foldername(name))[1] = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')
);

-- ──────────────────────────────────────────
-- 8. RLS cho chat_room_participants (thiếu từ migration gốc)
-- ──────────────────────────────────────────
CREATE POLICY "Users can view own participation" ON public.chat_room_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own read receipt" ON public.chat_room_participants
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────
-- 9. Enable Realtime cho chat_messages
-- ──────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- ──────────────────────────────────────────
-- 10. Grant permissions
-- ──────────────────────────────────────────
GRANT SELECT, INSERT ON public.chat_rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.chat_room_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.chat_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_or_create_chat_room TO authenticated;
