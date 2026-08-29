-- ============================================================
-- Migration: Enrich rpc_get_chat_messages with sender profile join
-- Description: JOINs public.profiles to return sender_name, sender_role,
-- and sender_avatar_url directly in message payload.
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_get_chat_messages(
  p_room_id UUID,
  p_cursor TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  v_user_id := auth.uid();
  v_tenant_id := public.current_tenant_id();

  -- If caller is in tenant, ensure participant record exists
  IF v_user_id IS NOT NULL AND v_tenant_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE id = p_room_id AND tenant_id = v_tenant_id
    ) THEN
      INSERT INTO public.chat_room_participants (room_id, user_id, role)
      VALUES (p_room_id, v_user_id, 'member')
      ON CONFLICT (room_id, user_id) DO NOTHING;
    END IF;
  END IF;

  -- Verify caller is participant
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_room_participants
    WHERE room_id = p_room_id AND user_id = v_user_id
  ) THEN
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
        ) ORDER BY r.created_at ASC
      ) AS reactions
    FROM public.chat_message_reactions r
    JOIN msg_page mp ON r.message_id = mp.id
    LEFT JOIN public.profiles p ON r.user_id = p.id
    GROUP BY r.message_id
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'client_id', m.client_id,
      'tenant_id', m.tenant_id,
      'room_id', m.room_id,
      'sender_id', m.sender_id,
      'sender_name', m.sender_full_name,
      'sender_role', m.sender_user_role,
      'sender_avatar_url', m.sender_avatar,
      'message_type', m.message_type,
      'content', m.content,
      'image_url', m.image_url,
      'file_url', m.file_url,
      'file_name', m.file_name,
      'file_type', m.file_type,
      'reply_to_id', m.reply_to_id,
      'reply_to_message', m.reply_to_message,
      'status', m.status,
      'created_at', m.created_at,
      'deleted_at', m.deleted_at,
      'is_pinned', COALESCE(m.is_pinned, false),
      'pinned_at', m.pinned_at,
      'pinned_by', m.pinned_by,
      'mentions', COALESCE(m.mentions, '[]'::jsonb),
      'reactions', COALESCE(mr.reactions, '[]'::jsonb)
    ) ORDER BY m.created_at DESC
  )
  INTO v_result
  FROM msg_page m
  LEFT JOIN msg_reactions mr ON m.id = mr.message_id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.rpc_get_chat_messages(UUID, TIMESTAMPTZ, INT) TO authenticated;
