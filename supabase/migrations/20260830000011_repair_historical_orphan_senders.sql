-- ============================================================
-- Migration: Repair Historical Orphan Senders
-- Description: Ensures all historical message senders are backfilled into chat_room_participants
-- ============================================================

INSERT INTO public.chat_room_participants (room_id, user_id, role)
SELECT DISTINCT m.room_id, m.sender_id, 'member'
FROM public.chat_messages m
JOIN auth.users u ON m.sender_id = u.id
WHERE m.sender_id IS NOT NULL
ON CONFLICT (room_id, user_id) DO NOTHING;
