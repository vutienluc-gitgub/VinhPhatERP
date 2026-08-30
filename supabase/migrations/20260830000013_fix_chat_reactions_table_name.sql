-- ============================================================
-- Migration: Fix table reference in rpc_get_chat_messages
-- Description: Corrects public.chat_reactions to public.chat_message_reactions
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_get_chat_messages(
  p_room_id UUID,
  p_cursor TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_is_authorized BOOLEAN;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Missing user authentication';
  END IF;

  -- Verify authorization via unified policy abstraction
  v_is_authorized := public.fn_can_access_chat_room(p_room_id, v_user_id);

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Access denied to room %', p_room_id;
  END IF;

  WITH msg_page AS (
    SELECT m.*, sp.full_name AS sender_full_name, sp.role AS sender_user_role, sp.avatar_url AS sender_avatar
    FROM public.chat_messages m
    LEFT JOIN public.profiles sp ON m.sender_id = sp.id
    WHERE m.room_id = p_room_id
      AND m.deleted_at IS NULL
      AND (p_cursor IS NULL OR m.created_at < p_cursor)
    ORDER BY m.created_at DESC
    LIMIT LEAST(p_limit, 100)
  ),
  msg_reactions AS (
    SELECT
      r.message_id,
      jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'message_id', r.message_id,
          'user_id', r.user_id,
          'user_name', COALESCE(p.full_name, 'Thành viên'),
          'emoji', r.emoji,
          'created_at', r.created_at
        )
        ORDER BY r.created_at ASC
      ) AS reactions
    FROM public.chat_message_reactions r
    JOIN msg_page mp ON r.message_id = mp.id
    LEFT JOIN public.profiles p ON r.user_id = p.id
    GROUP BY r.message_id
  ),
  ordered_page AS (
    SELECT
      mp.id,
      mp.client_id,
      mp.tenant_id,
      mp.room_id,
      mp.sender_id,
      mp.sender_full_name,
      mp.sender_user_role,
      mp.sender_avatar,
      mp.message_type,
      mp.content,
      mp.image_url,
      mp.file_url,
      mp.file_name,
      mp.file_type,
      mp.reply_to_id,
      mp.reply_to_message,
      mp.status,
      mp.mentions,
      mp.is_pinned,
      mp.pinned_at,
      mp.pinned_by,
      mp.created_at,
      mp.deleted_at,
      COALESCE(mr.reactions, '[]'::jsonb) AS reactions
    FROM msg_page mp
    LEFT JOIN msg_reactions mr ON mp.id = mr.message_id
    ORDER BY mp.created_at ASC
  )
  SELECT jsonb_build_object(
    'messages', COALESCE(jsonb_agg(to_jsonb(op)), '[]'::jsonb),
    'has_more', (SELECT COUNT(*) FROM msg_page) = LEAST(p_limit, 100),
    'next_cursor', (SELECT MIN(created_at) FROM msg_page)
  )
  INTO v_result
  FROM ordered_page op;

  RETURN COALESCE(v_result, jsonb_build_object(
    'messages', '[]'::jsonb,
    'has_more', false,
    'next_cursor', NULL
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.rpc_get_chat_messages(UUID, TIMESTAMPTZ, INT) TO authenticated;
