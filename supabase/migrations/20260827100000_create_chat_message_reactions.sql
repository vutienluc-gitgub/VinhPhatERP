-- Migration: Create chat_message_reactions table for Chat Subsystem
-- Description: Stores emoji reactions per message per user with idempotent constraints

CREATE TABLE IF NOT EXISTS public.chat_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_chat_message_reaction UNIQUE (message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow authenticated read chat_message_reactions" ON public.chat_message_reactions;
CREATE POLICY "Allow authenticated read chat_message_reactions" 
  ON public.chat_message_reactions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert chat_message_reactions" ON public.chat_message_reactions;
CREATE POLICY "Allow authenticated insert chat_message_reactions" 
  ON public.chat_message_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow authenticated delete chat_message_reactions" ON public.chat_message_reactions;
CREATE POLICY "Allow authenticated delete chat_message_reactions" 
  ON public.chat_message_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_chat_message_reactions_message_id 
  ON public.chat_message_reactions(message_id);

CREATE INDEX IF NOT EXISTS idx_chat_message_reactions_user_id 
  ON public.chat_message_reactions(user_id);
