-- ============================================================
-- Chat Phase 2: AI Bot Orchestration Webhook
-- ============================================================

-- Ensure pg_net extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.trigger_chat_ai_orchestrator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Prevent infinite loops if the system inserts messages
  IF NEW.message_type = 'system' THEN
    RETURN NEW;
  END IF;

  -- Fire the HTTP request asynchronously to our edge function
  -- We assume the environment is set or fallback to docker host
  PERFORM net.http_post(
    url := coalesce(
      current_setting('app.settings.edge_function_url', true),
      'http://host.docker.internal:54321/functions/v1/chat-ai-orchestrator'
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', coalesce(current_setting('app.settings.edge_function_anon_key', true), '')
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW)
    )
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chat_ai_trigger ON public.chat_messages;
CREATE TRIGGER chat_ai_trigger
  AFTER INSERT
  ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_chat_ai_orchestrator();
