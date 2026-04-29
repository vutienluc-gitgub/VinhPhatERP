-- ==========================================
-- ROLLBACK: Chat System — Triggers, Auto-close, Rate Limiting, Storage
-- ==========================================
-- CHỈ CHẠY KHI CẦN REVERT. Không tự động chạy.

-- 10. Revoke permissions
REVOKE EXECUTE ON FUNCTION public.rpc_get_or_create_chat_room FROM authenticated;
REVOKE SELECT, INSERT, UPDATE ON public.chat_messages FROM authenticated;
REVOKE SELECT, INSERT, UPDATE ON public.chat_room_participants FROM authenticated;
REVOKE SELECT, INSERT ON public.chat_rooms FROM authenticated;

-- 9. Remove from realtime
ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_messages;

-- 8. Drop participant RLS
DROP POLICY IF EXISTS "Users can view own participation" ON public.chat_room_participants;
DROP POLICY IF EXISTS "Users can update own read receipt" ON public.chat_room_participants;

-- 7. Drop storage policies & bucket
DROP POLICY IF EXISTS "Tenant can read own chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Tenant can upload chat attachments" ON storage.objects;
DELETE FROM storage.buckets WHERE id = 'chat_attachments';

-- 6. Drop unique index on client_id
DROP INDEX IF EXISTS public.idx_chat_messages_client_id_unique;

-- 5. Drop rate limit trigger
DROP TRIGGER IF EXISTS trg_chat_rate_limit ON public.chat_messages;
DROP FUNCTION IF EXISTS public.trg_fn_chat_rate_limit();

-- 4. Drop last_chat_at trigger
DROP TRIGGER IF EXISTS trg_update_shipment_last_chat ON public.chat_messages;
DROP FUNCTION IF EXISTS public.trg_fn_update_shipment_last_chat();

-- 3. Drop auto-close trigger
DROP TRIGGER IF EXISTS trg_close_chat_on_delivery ON public.shipments;
DROP FUNCTION IF EXISTS public.trg_fn_close_chat_on_delivery();

-- 2. Drop auto-create trigger
DROP TRIGGER IF EXISTS trg_create_chat_room_on_shipment ON public.shipments;
DROP FUNCTION IF EXISTS public.trg_fn_create_chat_room_on_shipment();

-- 1. Remove last_chat_at column
ALTER TABLE public.shipments DROP COLUMN IF EXISTS last_chat_at;
