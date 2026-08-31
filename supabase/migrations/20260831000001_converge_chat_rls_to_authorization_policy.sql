-- ============================================================
-- Migration: Converge Chat RLS Policies to Unified Authorization Policy (Method C)
-- Description:
-- Replaces fragmented/legacy subqueries with public.fn_can_access_chat_room(room_id, auth.uid())
-- across chat_rooms, chat_messages, chat_message_reactions, and chat_room_participants.
-- Ensures Realtime publications and direct client queries operate seamlessly.
-- ============================================================

-- ── 1. chat_rooms RLS Policies ──
DROP POLICY IF EXISTS "Users can view rooms they are part of" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view authorized chat rooms" ON public.chat_rooms;

CREATE POLICY "Users can view authorized chat rooms"
  ON public.chat_rooms
  FOR SELECT
  TO authenticated
  USING (
    public.fn_can_access_chat_room(id, auth.uid()) = true
  );

-- ── 2. chat_messages RLS Policies ──
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update messages in their rooms" ON public.chat_messages;

CREATE POLICY "Users can view messages in their rooms"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    public.fn_can_access_chat_room(room_id, auth.uid()) = true
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can insert messages in their rooms"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.fn_can_access_chat_room(room_id, auth.uid()) = true
    AND sender_id = auth.uid()
  );

CREATE POLICY "Users can update messages in their rooms"
  ON public.chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    public.fn_can_access_chat_room(room_id, auth.uid()) = true
    AND sender_id = auth.uid()
  )
  WITH CHECK (
    public.fn_can_access_chat_room(room_id, auth.uid()) = true
    AND sender_id = auth.uid()
  );

-- ── 3. chat_message_reactions RLS Policies ──
DROP POLICY IF EXISTS "Allow authenticated read chat_message_reactions" ON public.chat_message_reactions;
DROP POLICY IF EXISTS "Allow authenticated insert chat_message_reactions" ON public.chat_message_reactions;
DROP POLICY IF EXISTS "Allow authenticated delete chat_message_reactions" ON public.chat_message_reactions;

CREATE POLICY "Users can view reactions in their rooms"
  ON public.chat_message_reactions
  FOR SELECT
  TO authenticated
  USING (
    public.fn_can_access_chat_room(room_id, auth.uid()) = true
  );

CREATE POLICY "Users can insert reactions in their rooms"
  ON public.chat_message_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.fn_can_access_chat_room(room_id, auth.uid()) = true
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can delete own reactions"
  ON public.chat_message_reactions
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- ── 4. chat_room_participants RLS Policies ──
DROP POLICY IF EXISTS "Users can view own participation" ON public.chat_room_participants;
DROP POLICY IF EXISTS "Users can join chat rooms" ON public.chat_room_participants;
DROP POLICY IF EXISTS "Users can update own read receipt" ON public.chat_room_participants;

CREATE POLICY "Users can view participants in authorized rooms"
  ON public.chat_room_participants
  FOR SELECT
  TO authenticated
  USING (
    public.fn_can_access_chat_room(room_id, auth.uid()) = true
  );

CREATE POLICY "Users can join authorized chat rooms"
  ON public.chat_room_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.fn_can_access_chat_room(room_id, auth.uid()) = true
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update own participation receipt"
  ON public.chat_room_participants
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );
