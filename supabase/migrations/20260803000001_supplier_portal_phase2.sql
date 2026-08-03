-- ==========================================
-- Migration: Supplier Portal Phase 2
-- Description: Dual-channel Chat, Supplier View Tracking, Notifications
-- ==========================================

-- 1. Thêm trường đánh dấu trạng thái Đã Xem của NCC
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS supplier_viewed_at TIMESTAMPTZ;

-- 2. Thêm cột Phân loại (Visibility) cho Comment
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'po_comment_visibility') THEN
    CREATE TYPE public.po_comment_visibility AS ENUM ('internal', 'external');
  END IF;
END $$;

ALTER TABLE public.purchase_order_comments
ADD COLUMN IF NOT EXISTS visibility public.po_comment_visibility NOT NULL DEFAULT 'external';

-- 3. Tạo Trigger Gửi Notification cho ERP khi NCC chat
CREATE OR REPLACE FUNCTION public.trg_notify_on_supplier_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_po_created_by UUID;
    v_po_person_in_charge UUID;
    v_po_code VARCHAR;
BEGIN
    -- Chỉ trigger khi người gửi là nhà cung cấp
    IF NEW.sender_type = 'supplier' THEN
        -- Lấy thông tin đơn hàng
        SELECT created_by, person_in_charge, code 
        INTO v_po_created_by, v_po_person_in_charge, v_po_code
        FROM public.purchase_orders
        WHERE id = NEW.purchase_order_id;

        -- Tạo thông báo gửi cho người phụ trách hoặc người tạo đơn
        INSERT INTO public.notifications (
            target_user_id,
            title,
            message,
            resource_type,
            resource_id
        ) VALUES (
            COALESCE(v_po_person_in_charge, v_po_created_by),
            'Tin nhắn mới từ Nhà cung cấp',
            'Nhà cung cấp vừa phản hồi trên đơn hàng ' || COALESCE(v_po_code, ''),
            'purchase_order',
            NEW.purchase_order_id::VARCHAR
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_supplier_comment_created ON public.purchase_order_comments;
CREATE TRIGGER on_supplier_comment_created
    AFTER INSERT ON public.purchase_order_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_notify_on_supplier_comment();

-- 4. Cập nhật RPC lấy danh sách comment (Portal chỉ thấy tin nhắn external)
CREATE OR REPLACE FUNCTION public.rpc_get_public_po_comments(
  p_token UUID
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  sender_type public.po_comment_sender_type,
  sender_id UUID,
  sender_name VARCHAR,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_po_id UUID;
  v_status public.purchase_order_status;
BEGIN
  SELECT po.id, po.status INTO v_po_id, v_status
  FROM public.purchase_orders po
  WHERE po.public_token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not found or invalid token';
  END IF;

  RETURN QUERY
  SELECT 
    c.id, c.content, c.sender_type, c.sender_id, c.sender_name, c.created_at
  FROM public.purchase_order_comments c
  WHERE c.purchase_order_id = v_po_id
    AND c.visibility = 'external' -- Chỉ lấy tin nhắn public
  ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
