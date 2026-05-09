-- ============================================================
-- Chat P1: Global Unread Counter + Pin Messages
-- ============================================================

-- ── Feature 2: Global Unread Counter RPC ──

CREATE OR REPLACE FUNCTION rpc_get_total_unread()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(cnt), 0)::INTEGER INTO v_total
  FROM (
    SELECT COUNT(*) AS cnt
    FROM chat_room_participants p
    JOIN chat_messages m ON m.room_id = p.room_id
    WHERE p.user_id = auth.uid()
      AND m.deleted_at IS NULL
      AND m.message_type NOT IN ('system', 'system_epod')
      AND m.sender_id IS DISTINCT FROM auth.uid()
      AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)
  ) sub;

  RETURN v_total;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_get_total_unread() TO authenticated;

-- ── Feature 2: Fetch all rooms for inbox (universal) ──

CREATE OR REPLACE FUNCTION rpc_get_my_chat_rooms()
RETURNS TABLE(
  room_id UUID,
  entity_type TEXT,
  entity_id UUID,
  room_status TEXT,
  updated_at TIMESTAMPTZ,
  unread_count BIGINT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_type TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS room_id,
    r.entity_type::TEXT,
    r.entity_id,
    r.status::TEXT AS room_status,
    r.updated_at,
    -- Unread count
    (
      SELECT COUNT(*)
      FROM chat_messages m
      WHERE m.room_id = r.id
        AND m.deleted_at IS NULL
        AND m.message_type NOT IN ('system', 'system_epod')
        AND m.sender_id IS DISTINCT FROM auth.uid()
        AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)
    ) AS unread_count,
    -- Last message
    lm.content AS last_message,
    lm.created_at AS last_message_at,
    lm.message_type::TEXT AS last_message_type
  FROM chat_room_participants p
  JOIN chat_rooms r ON r.id = p.room_id
  LEFT JOIN LATERAL (
    SELECT cm.content, cm.created_at, cm.message_type
    FROM chat_messages cm
    WHERE cm.room_id = r.id
      AND cm.deleted_at IS NULL
    ORDER BY cm.created_at DESC
    LIMIT 1
  ) lm ON TRUE
  WHERE p.user_id = auth.uid()
    AND r.tenant_id = (SELECT current_tenant_id())
  ORDER BY COALESCE(lm.created_at, r.updated_at) DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_get_my_chat_rooms() TO authenticated;


-- ── Feature 3: Pin Messages ──

-- Add pin columns (idempotent)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS pinned_by UUID REFERENCES auth.users(id);

-- Index for fast pin lookup
CREATE INDEX IF NOT EXISTS idx_chat_messages_pinned
  ON chat_messages(room_id, is_pinned)
  WHERE is_pinned = TRUE;

-- Toggle pin RPC (admin/manager only)
CREATE OR REPLACE FUNCTION rpc_toggle_pin_message(
  p_message_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current BOOLEAN;
  v_room_id UUID;
  v_user_role TEXT;
BEGIN
  -- Check caller role (admin/manager only)
  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = auth.uid();

  IF v_user_role NOT IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'Only admin or manager can pin messages';
  END IF;

  SELECT is_pinned, room_id INTO v_current, v_room_id
  FROM chat_messages WHERE id = p_message_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  -- Verify user is participant of this room
  IF NOT EXISTS (
    SELECT 1 FROM chat_room_participants
    WHERE room_id = v_room_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a participant of this room';
  END IF;

  UPDATE chat_messages
  SET is_pinned  = NOT COALESCE(v_current, FALSE),
      pinned_at  = CASE WHEN NOT COALESCE(v_current, FALSE) THEN now() ELSE NULL END,
      pinned_by  = CASE WHEN NOT COALESCE(v_current, FALSE) THEN auth.uid() ELSE NULL END
  WHERE id = p_message_id;

  RETURN NOT COALESCE(v_current, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_toggle_pin_message(UUID) TO authenticated;

-- Fetch pinned messages for a room
CREATE OR REPLACE FUNCTION rpc_get_pinned_messages(
  p_room_id UUID
) RETURNS SETOF chat_messages
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is participant
  IF NOT EXISTS (
    SELECT 1 FROM chat_room_participants
    WHERE room_id = p_room_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a participant of this room';
  END IF;

  RETURN QUERY
  SELECT *
  FROM chat_messages
  WHERE room_id = p_room_id
    AND is_pinned = TRUE
    AND deleted_at IS NULL
  ORDER BY pinned_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_get_pinned_messages(UUID) TO authenticated;
