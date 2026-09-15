-- ============================================================
-- Migration: Full-Text Search & Trigram Index for Chat
-- Target: Fast, unaccented, fuzzy & document code search on chat_messages
-- Date: 2026-09-16
-- ============================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Add GIN Trigram Index on chat_messages.content for fast ILIKE / substring searches
CREATE INDEX IF NOT EXISTS idx_chat_messages_content_trgm
ON public.chat_messages USING GIN (content gin_trgm_ops)
WHERE deleted_at IS NULL;

-- 3. RPC: rpc_search_chat_messages
-- Supports unaccented search, trigram matching, and document code lookups
CREATE OR REPLACE FUNCTION public.rpc_search_chat_messages(
  p_room_id UUID,
  p_query TEXT,
  p_limit INT DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  client_id UUID,
  tenant_id UUID,
  room_id UUID,
  sender_id UUID,
  message_type VARCHAR,
  content TEXT,
  image_url TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type VARCHAR,
  reply_to_id UUID,
  reply_to_message JSONB,
  status VARCHAR,
  mentions JSONB,
  is_pinned BOOLEAN,
  pinned_at TIMESTAMPTZ,
  pinned_by UUID,
  created_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_clean_query TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Missing user authentication';
  END IF;

  -- 1. Verify authorization using existing room policy
  IF NOT public.fn_can_access_chat_room(p_room_id, v_user_id) THEN
    RAISE EXCEPTION 'Access denied: user % is not authorized for room %', v_user_id, p_room_id;
  END IF;

  v_clean_query := TRIM(p_query);
  IF v_clean_query = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.client_id,
    m.tenant_id,
    m.room_id,
    m.sender_id,
    m.message_type,
    m.content,
    m.image_url,
    m.file_url,
    m.file_name,
    m.file_type,
    m.reply_to_id,
    m.reply_to_message,
    m.status,
    m.mentions,
    m.is_pinned,
    m.pinned_at,
    m.pinned_by,
    m.created_at,
    m.deleted_at
  FROM public.chat_messages m
  WHERE m.room_id = p_room_id
    AND m.deleted_at IS NULL
    AND (
      m.content ILIKE '%' || v_clean_query || '%'
      OR public.unaccent(m.content) ILIKE '%' || public.unaccent(v_clean_query) || '%'
    )
  ORDER BY m.created_at DESC
  LIMIT LEAST(p_limit, 100);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_search_chat_messages(UUID, TEXT, INT) TO authenticated;
