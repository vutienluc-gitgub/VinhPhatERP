-- ============================================================
-- Migration: Harden Chat Message Insert Trigger & Push Dispatch
-- Description:
-- 1. Uses robust fallback for edge function URL and anon key
-- 2. Wraps push notification HTTP call in BEGIN ... EXCEPTION block
--    so chat message insertion NEVER fails even if network/push fails
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_fn_chat_message_inserted()
RETURNS TRIGGER AS $$
DECLARE
  v_recipients UUID[];
  v_sender_name TEXT;
  v_room RECORD;
  v_payload JSONB;
  v_push_url TEXT;
  v_anon_key TEXT;
BEGIN
  -- 1. Increment unread count ONLY for explicit participants (excluding sender)
  IF NEW.sender_id IS NOT NULL THEN
    UPDATE public.chat_room_participants
    SET unread_count = unread_count + 1
    WHERE room_id = NEW.room_id
      AND user_id <> NEW.sender_id;
  END IF;

  -- 2. Resolve final notification recipients via decoupled policy resolver
  v_recipients := public.fn_resolve_chat_notification_recipients(NEW.id);

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
      'content', CASE 
        WHEN NEW.message_type = 'image' THEN 'Đã gửi một hình ảnh'
        WHEN NEW.message_type = 'file' THEN 'Đã gửi một tệp đính kèm'
        ELSE LEFT(NEW.content, 200)
      END,
      'entity_type', v_room.entity_type,
      'entity_id', v_room.entity_id,
      'recipients', to_jsonb(v_recipients)
    );

    v_push_url := coalesce(
      nullif(current_setting('app.settings.edge_function_url', true), ''),
      'https://sxphijrofljxkccdwtub.supabase.co/functions/v1/send-web-push'
    );

    v_anon_key := coalesce(
      nullif(current_setting('app.settings.edge_function_anon_key', true), ''),
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDk1NTksImV4cCI6MjA5MDA4NTU1OX0.8e-qbhqv6UgCZ46Yx7sa9FWGCdT50q27i4kAiMtCpxc'
    );

    -- 3. Non-blocking asynchronous HTTP push dispatch
    BEGIN
      PERFORM net.http_post(
        url := v_push_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_anon_key
        ),
        body := v_payload
      );
    EXCEPTION WHEN OTHERS THEN
      -- Silently catch push dispatch notices so message insert always succeeds 100%
      RAISE WARNING '[trg_fn_chat_message_inserted] Push notice: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
