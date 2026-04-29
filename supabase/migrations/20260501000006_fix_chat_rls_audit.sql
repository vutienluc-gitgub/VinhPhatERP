-- ==========================================
-- Migration: Fix chat RLS audit issues
-- ==========================================
-- Audit found:
-- 1. CRITICAL: chat_messages SELECT policy missing `deleted_at IS NULL` filter
--    (was dropped and recreated by 000005 without the soft-delete check)
-- 2. MEDIUM: Missing UPDATE policy on chat_messages (needed for softDeleteMessage)
-- 3. MEDIUM: chat_room_participants needs INSERT policy for customer portal auto-join

-- ── 1. Fix SELECT policy: Add back deleted_at filter ──
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
CREATE POLICY "Users can view messages in their rooms" ON public.chat_messages
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    AND room_id IN (SELECT room_id FROM public.chat_room_participants WHERE user_id = auth.uid())
    AND deleted_at IS NULL
  );

-- ── 2. Add UPDATE policy for soft delete ──
DROP POLICY IF EXISTS "Users can update messages in their rooms" ON public.chat_messages;
CREATE POLICY "Users can update messages in their rooms" ON public.chat_messages
  FOR UPDATE USING (
    tenant_id = public.current_tenant_id()
    AND sender_id = auth.uid()
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND sender_id = auth.uid()
  );
