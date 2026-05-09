-- ============================================================
-- Chat Phase 2: Unified Timeline Feed
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_get_unified_timeline(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
) RETURNS TABLE(
  id UUID,
  room_id UUID,
  sender_id UUID,
  content TEXT,
  message_type VARCHAR,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  is_pinned BOOLEAN,
  mentions JSONB,
  entity_type VARCHAR,
  entity_id UUID,
  sender_name TEXT,
  sender_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.room_id,
    m.sender_id,
    m.content,
    m.message_type,
    m.image_url,
    m.created_at,
    m.is_pinned,
    m.mentions,
    r.entity_type,
    r.entity_id,
    p.full_name AS sender_name,
    p.role AS sender_role
  FROM public.chat_messages m
  JOIN public.chat_rooms r ON r.id = m.room_id
  JOIN public.chat_room_participants rp ON rp.room_id = m.room_id
  LEFT JOIN public.profiles p ON p.id = m.sender_id
  WHERE rp.user_id = auth.uid()
    AND m.deleted_at IS NULL
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.rpc_get_unified_timeline TO authenticated;
