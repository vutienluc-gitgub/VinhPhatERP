-- ==========================================
-- Migration: Add missing deleted_at column to chat_messages
-- ==========================================
-- Bug fix: The chat_messages table was created without deleted_at column
-- but the application code references it in:
-- 1. fetchChatMessages: .is('deleted_at', null) → causes 400
-- 2. softDeleteMessage: .update({ deleted_at: ... }) → causes 400
-- 3. chatMessageResponseSchema: validates deleted_at field

ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.chat_messages.deleted_at
IS 'Soft delete timestamp — NULL means message is active';

-- Add index for efficient filtering of non-deleted messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_deleted_at
ON public.chat_messages(deleted_at)
WHERE deleted_at IS NULL;
