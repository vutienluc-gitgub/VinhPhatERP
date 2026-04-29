-- ==========================================
-- Migration: Chat System Infrastructure
-- ==========================================

-- 1. Create chat_rooms table
CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  entity_type VARCHAR NOT NULL,
  entity_id UUID NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, entity_type, entity_id) -- Bắt buộc cho rpc_get_or_create
);

-- 2. Create chat_room_participants (Access Control Layer)
CREATE TABLE public.chat_room_participants (
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_message_id UUID, -- Sẽ add FK sau khi tạo chat_messages
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- 3. Create chat_messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL, -- Chống duplicate
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id), -- Nullable cho system messages
  message_type VARCHAR NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  image_url TEXT,
  status VARCHAR NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint back to chat_room_participants
ALTER TABLE public.chat_room_participants 
ADD CONSTRAINT fk_last_read_message 
FOREIGN KEY (last_read_message_id) REFERENCES public.chat_messages(id) ON DELETE SET NULL;

-- 4. Indexes for performance
CREATE INDEX idx_chat_messages_room_created ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX idx_chat_rooms_entity ON public.chat_rooms(entity_type, entity_id);
CREATE INDEX idx_chat_room_participants_user ON public.chat_room_participants(user_id);

-- 5. RPC: get_or_create_chat_room
CREATE OR REPLACE FUNCTION public.rpc_get_or_create_chat_room(
  p_entity_type TEXT, 
  p_entity_id UUID
) RETURNS UUID AS $$
DECLARE
  v_room_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Lấy current tenant_id từ JWT (Đặc tả SaaS)
  v_tenant_id := (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::UUID;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Missing tenant_id in JWT';
  END IF;

  INSERT INTO public.chat_rooms (tenant_id, entity_type, entity_id, status)
  VALUES (v_tenant_id, p_entity_type, p_entity_id, 'active')
  ON CONFLICT (tenant_id, entity_type, entity_id) DO NOTHING
  RETURNING id INTO v_room_id;

  IF v_room_id IS NULL THEN
    SELECT id INTO v_room_id FROM public.chat_rooms
    WHERE tenant_id = v_tenant_id
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id;
  END IF;

  RETURN v_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
CREATE POLICY "Users can view rooms they are part of" ON public.chat_rooms
  FOR SELECT USING (
    tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::UUID
    AND id IN (SELECT room_id FROM public.chat_room_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view messages in their rooms" ON public.chat_messages
  FOR SELECT USING (
    tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::UUID
    AND room_id IN (SELECT room_id FROM public.chat_room_participants WHERE user_id = auth.uid())
  );
  
CREATE POLICY "Users can insert messages in their rooms" ON public.chat_messages
  FOR INSERT WITH CHECK (
    tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::UUID
    AND room_id IN (SELECT room_id FROM public.chat_room_participants WHERE user_id = auth.uid())
  );

-- 8. Storage RLS (Tenant Isolation Prefix)
-- LƯU Ý: Chạy phần này yêu cầu cấu hình bucket "chat_media" từ trước.
-- CREATE POLICY "tenant isolation on chat_media"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'chat_media'
--   AND (storage.foldername(name))[1] = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id'));
