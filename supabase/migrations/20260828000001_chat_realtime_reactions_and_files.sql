-- ============================================================
-- Migration: Add file metadata to chat_messages and enable realtime reactions
-- Description:
-- 1. Adds file_url, file_name, file_type columns to chat_messages
-- 2. Updates rpc_send_chat_message to support file metadata
-- 3. Adds room_id to chat_message_reactions with auto-populate trigger
-- 4. Adds chat_message_reactions to supabase_realtime publication
-- ============================================================

-- ── 1. Add file columns to chat_messages ──
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_type VARCHAR(100);

-- ── 2. Add room_id to chat_message_reactions for scoped realtime filtering ──
ALTER TABLE public.chat_message_reactions
  ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_chat_message_reactions_room_id
  ON public.chat_message_reactions(room_id);

-- Trigger to auto-populate room_id from chat_messages if not provided
CREATE OR REPLACE FUNCTION public.fn_set_chat_reaction_room_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.room_id IS NULL THEN
    SELECT room_id INTO NEW.room_id
    FROM public.chat_messages
    WHERE id = NEW.message_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_chat_reaction_room_id ON public.chat_message_reactions;
CREATE TRIGGER trg_set_chat_reaction_room_id
  BEFORE INSERT ON public.chat_message_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_set_chat_reaction_room_id();

-- Backfill room_id for existing reactions
UPDATE public.chat_message_reactions r
SET room_id = m.room_id
FROM public.chat_messages m
WHERE r.message_id = m.id AND r.room_id IS NULL;

-- ── 3. Update rpc_send_chat_message with file support ──
CREATE OR REPLACE FUNCTION public.rpc_send_chat_message(
  p_client_id UUID,
  p_room_id UUID,
  p_content TEXT,
  p_message_type VARCHAR DEFAULT 'text',
  p_image_url TEXT DEFAULT NULL,
  p_mentions JSONB DEFAULT '[]'::jsonb,
  p_file_url TEXT DEFAULT NULL,
  p_file_name TEXT DEFAULT NULL,
  p_file_type VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_message_id UUID;
  v_is_participant BOOLEAN;
BEGIN
  v_tenant_id := public.current_tenant_id();

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Cannot resolve tenant for current user (uid=%)', auth.uid();
  END IF;

  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Missing user authentication';
  END IF;

  -- Check participant using SET LOCAL to bypass RLS inside this SECURITY DEFINER fn
  SELECT EXISTS (
    SELECT 1 FROM public.chat_room_participants
    WHERE room_id = p_room_id AND user_id = v_user_id
  ) INTO v_is_participant;

  IF NOT v_is_participant THEN
    -- Auto-join: add caller as member (idempotent) rather than hard-fail
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    VALUES (p_room_id, v_user_id, 'member')
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;

  -- Idempotent insert
  INSERT INTO public.chat_messages (
    client_id, tenant_id, room_id, sender_id,
    message_type, content, image_url, file_url, file_name, file_type, status, mentions
  )
  VALUES (
    p_client_id, v_tenant_id, p_room_id, v_user_id,
    p_message_type, p_content, p_image_url, p_file_url, p_file_name, p_file_type, 'sent', COALESCE(p_mentions, '[]'::jsonb)
  )
  ON CONFLICT (client_id) DO NOTHING
  RETURNING id INTO v_message_id;

  IF v_message_id IS NULL THEN
    SELECT id INTO v_message_id FROM public.chat_messages
    WHERE client_id = p_client_id;
  END IF;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.rpc_send_chat_message(UUID, UUID, TEXT, VARCHAR, TEXT, JSONB, TEXT, TEXT, VARCHAR) TO authenticated;

-- ── 4. Add chat_message_reactions to Supabase Realtime publication ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reactions;
  END IF;
END;
$$;
