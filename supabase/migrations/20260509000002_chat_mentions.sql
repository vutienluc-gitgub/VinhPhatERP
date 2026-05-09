-- ============================================================
-- Chat Phase 2: Mentions & References
-- ============================================================

-- Add mentions column to chat_messages
-- Structure: [{ "type": "user", "id": "uuid", "label": "Name" }, { "type": "document", "entity_type": "shipment", "entity_id": "uuid", "label": "XK2604" }]
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS mentions JSONB DEFAULT '[]'::jsonb;

-- Create an index to quickly find messages mentioning a specific user (using GIN index on jsonb)
CREATE INDEX IF NOT EXISTS idx_chat_messages_mentions ON chat_messages USING GIN (mentions);

-- Update the unread counter logic to potentially prioritize mentions (Optional, keeping same for now)
-- The existing rpc_get_total_unread can remain the same, but we can add a new RPC for "my mentions"

CREATE OR REPLACE FUNCTION rpc_get_my_mentions()
RETURNS TABLE(
  message_id UUID,
  room_id UUID,
  sender_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  entity_type TEXT,
  entity_id UUID
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id, m.room_id, m.sender_id, m.content, m.created_at,
    r.entity_type::TEXT, r.entity_id
  FROM chat_messages m
  JOIN chat_rooms r ON r.id = m.room_id
  WHERE m.mentions @> jsonb_build_array(jsonb_build_object('type', 'user', 'id', auth.uid()::text))
     OR m.mentions @> jsonb_build_array(jsonb_build_object('type', 'role', 'id', (SELECT role FROM profiles WHERE id = auth.uid())))
  ORDER BY m.created_at DESC
  LIMIT 50;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_get_my_mentions() TO authenticated;
