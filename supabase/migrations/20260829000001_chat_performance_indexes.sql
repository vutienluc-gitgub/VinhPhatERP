-- Migration: High-Performance Composite Indexes for VinhPhatERP Chat
-- Optimization: Timeline pagination & Reaction lookup

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_timeline 
ON public.chat_messages (room_id, created_at DESC, id DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chat_reactions_room_lookup
ON public.chat_message_reactions (room_id, message_id);
