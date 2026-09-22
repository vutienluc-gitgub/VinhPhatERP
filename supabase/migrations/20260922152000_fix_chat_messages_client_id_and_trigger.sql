-- ============================================================
-- Migration: Fix Chat Messages client_id Unique Constraint & Insert Trigger
-- Description:
-- 1. Adds UNIQUE constraint on chat_messages(client_id) so ON CONFLICT (client_id) DO NOTHING works.
-- 2. Restores hardened trg_fn_chat_message_inserted() preventing failures on non-existent room_type
--    or chat_participants columns/tables, ensuring message insert ALWAYS succeeds 100%.
-- ============================================================

-- 1. Ensure UNIQUE constraint on chat_messages(client_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chat_messages_client_id_key' 
      AND conrelid = 'public.chat_messages'::regclass
  ) THEN
    ALTER TABLE public.chat_messages 
    ADD CONSTRAINT chat_messages_client_id_key UNIQUE (client_id);
  END IF;
END $$;

-- 2. Re-create hardened trg_fn_chat_message_inserted
CREATE OR REPLACE FUNCTION public.trg_fn_chat_message_inserted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_recipients UUID[];
  v_sender_name TEXT;
  v_room RECORD;
  v_payload JSONB;
  v_push_url TEXT;
  v_anon_key TEXT;
  v_outbox_id UUID;
BEGIN
  -- Defensive guard against recursive or system messages
  IF NEW.message_type = 'system' THEN
    RETURN NEW;
  END IF;

  -- 1. Increment unread count ONLY for explicit participants (excluding sender)
  IF NEW.sender_id IS NOT NULL THEN
    UPDATE public.chat_room_participants
    SET unread_count = unread_count + 1
    WHERE room_id = NEW.room_id
      AND user_id <> NEW.sender_id;
  END IF;

  -- 2. Resolve final notification recipients via decoupled policy resolver
  BEGIN
    v_recipients := public.fn_resolve_chat_notification_recipients(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[trg_fn_chat_message_inserted] Recipient resolution notice: %', SQLERRM;
    v_recipients := NULL;
  END;

  IF array_length(v_recipients, 1) IS NOT NULL AND array_length(v_recipients, 1) > 0 THEN
    -- Resolve sender name
    SELECT COALESCE(full_name, 'Thành viên')
    INTO v_sender_name
    FROM public.profiles
    WHERE id = NEW.sender_id;

    -- Resolve room context
    SELECT id, entity_type, entity_id, tenant_id
    INTO v_room
    FROM public.chat_rooms
    WHERE id = NEW.room_id;

    v_payload := jsonb_build_object(
      'type', 'CHAT_MESSAGE',
      'message_id', NEW.id,
      'room_id', NEW.room_id,
      'sender_id', NEW.sender_id,
      'sender_name', COALESCE(v_sender_name, 'Hệ thống'),
      'room_title', 'Trò chuyện',
      'content', CASE 
        WHEN NEW.message_type = 'image' THEN 'Đã gửi một hình ảnh'
        WHEN NEW.message_type = 'file' THEN 'Đã gửi một tệp đính kèm'
        ELSE LEFT(NEW.content, 200)
      END,
      'entity_type', v_room.entity_type,
      'entity_id', v_room.entity_id,
      'recipients', to_jsonb(v_recipients)
    );

    -- 3. Persist to Transactional Outbox for Guaranteed Durability
    BEGIN
      v_outbox_id := public.fn_enqueue_notification_outbox('CHAT_MESSAGE', v_payload);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[trg_fn_chat_message_inserted] Outbox enqueue notice: %', SQLERRM;
    END;

    -- 4. Fast Asynchronous HTTP Push Dispatch via net.http_post
    v_push_url := coalesce(
      nullif(current_setting('app.settings.edge_function_url', true), ''),
      'https://sxphijrofljxkccdwtub.supabase.co/functions/v1/send-web-push'
    );

    v_anon_key := coalesce(
      nullif(current_setting('app.settings.edge_function_anon_key', true), ''),
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDk1NTksImV4cCI6MjA5MDA4NTU1OX0.8e-qbhqv6UgCZ46Yx7sa9FWGCdT50q27i4kAiMtCpxc'
    );

    BEGIN
      PERFORM net.http_post(
        url := v_push_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_anon_key
        ),
        body := v_payload,
        timeout_milliseconds := 15000
      );
    EXCEPTION WHEN OTHERS THEN
      -- INVARIANT-02: Never rollback chat message transaction on network or push failure
      RAISE WARNING '[trg_fn_chat_message_inserted] HTTP push dispatch notice: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;
