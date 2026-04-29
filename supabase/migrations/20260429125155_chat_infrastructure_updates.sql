-- ==========================================
-- Migration: Chat System Infrastructure Updates (Nice-to-have)
-- ==========================================

-- 1. Soft Delete / GDPR: Thêm cột deleted_at
ALTER TABLE public.chat_messages 
ADD COLUMN deleted_at TIMESTAMPTZ;

-- Cập nhật RLS Policy để chỉ hiển thị tin nhắn chưa bị xóa
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
CREATE POLICY "Users can view messages in their rooms" ON public.chat_messages
  FOR SELECT USING (
    tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::UUID
    AND room_id IN (SELECT room_id FROM public.chat_room_participants WHERE user_id = auth.uid())
    AND deleted_at IS NULL
  );

-- 2. Mở rộng Storage cho File: Đổi tên tham chiếu từ chat_media sang chat_attachments
-- LƯU Ý: Bucket thực tế trên Supabase Dashboard nên được đổi tên hoặc tạo mới với tên 'chat_attachments'
-- và mở rộng mime_types bao gồm 'image/jpeg', 'image/png', 'image/webp', 'application/pdf'.

-- CẢNH BÁO STORAGE COST: Cần cấu hình Lifecycle Policy / Storage Expiration trên Supabase 
-- để tự động xóa các file thuộc về các đơn hàng (shipment/order) đã đóng quá 6 tháng.