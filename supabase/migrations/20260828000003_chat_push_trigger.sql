-- ============================================================
-- Chat Web Push & Unread Count Migration
-- 1. Adds unread_count to chat_room_participants
-- 2. Trigger on chat_messages to increment unread_count and send Web Push
-- ============================================================

-- 1. Add unread_count to chat_room_participants if it doesn't exist
ALTER TABLE public.chat_room_participants
ADD COLUMN IF NOT EXISTS unread_count INTEGER NOT NULL DEFAULT 0;

-- 2. Trigger function to handle chat message insert
CREATE OR REPLACE FUNCTION public.trg_fn_chat_message_inserted()
RETURNS TRIGGER AS $$
BEGIN
  -- 2.1 Increment unread_count for all other participants in the room
  IF NEW.sender_id IS NOT NULL THEN
    UPDATE public.chat_room_participants
    SET unread_count = unread_count + 1
    WHERE room_id = NEW.room_id
      AND user_id != NEW.sender_id;
  END IF;

  -- 2.2 Send Web Push notification via Edge Function (safe non-blocking)
  IF NEW.sender_id IS NOT NULL THEN
    BEGIN
      PERFORM net.http_post(
        url := coalesce(
          nullif(current_setting('app.settings.edge_function_url', true), ''),
          'https://sxphijrofljxkccdwtub.supabase.co/functions/v1/send-web-push'
        ),
        body := jsonb_build_object(
          'type', 'CHAT_MESSAGE',
          'message_id', NEW.id
        ),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || coalesce(
            nullif(current_setting('app.settings.edge_function_anon_key', true), ''),
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDk1NTksImV4cCI6MjA5MDA4NTU1OX0.8e-qbhqv6UgCZ46Yx7sa9FWGCdT50q27i4kAiMtCpxc'
          )
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Silently catch network trigger errors so message insert always succeeds
      RAISE WARNING '[trg_fn_chat_message_inserted] Push trigger notice: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS trg_chat_message_inserted ON public.chat_messages;
CREATE TRIGGER trg_chat_message_inserted
  AFTER INSERT
  ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_chat_message_inserted();
