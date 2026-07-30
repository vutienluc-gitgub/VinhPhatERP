-- ==========================================
-- Migration: Purchase Order Comments (Phase 4)
-- ==========================================

-- 1. Create enum for sender_type if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'po_comment_sender_type') THEN
    CREATE TYPE public.po_comment_sender_type AS ENUM ('erp', 'supplier');
  END IF;
END $$;

-- 2. Create table purchase_order_comments
CREATE TABLE IF NOT EXISTS public.purchase_order_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender_type public.po_comment_sender_type NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- for ERP staff
  sender_name VARCHAR, -- for Supplier name
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_po_comments_po_id ON public.purchase_order_comments(purchase_order_id, created_at ASC);

-- 4. Realtime Configuration
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'purchase_order_comments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_order_comments;
    END IF;
END $$;

-- 5. RLS Policies
ALTER TABLE public.purchase_order_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments in their tenant" ON public.purchase_order_comments
  FOR SELECT USING (
    tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::UUID
  );

CREATE POLICY "Users can insert comments in their tenant" ON public.purchase_order_comments
  FOR INSERT WITH CHECK (
    tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::UUID
  );

-- 6. RPC: rpc_get_public_po_comments
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
  -- Lấy PO từ token
  SELECT 
    po.id, po.status
  INTO 
    v_po_id, v_status
  FROM public.purchase_orders po
  WHERE po.public_token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not found or invalid token';
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.content,
    c.sender_type,
    c.sender_id,
    c.sender_name,
    c.created_at
  FROM public.purchase_order_comments c
  WHERE c.purchase_order_id = v_po_id
  ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: rpc_add_public_po_comment
CREATE OR REPLACE FUNCTION public.rpc_add_public_po_comment(
  p_token UUID,
  p_content TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_po public.purchase_orders%ROWTYPE;
  v_comment_id UUID;
BEGIN
  -- Lấy PO từ token
  SELECT *
  INTO v_po
  FROM public.purchase_orders
  WHERE public_token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not found or invalid token';
  END IF;

  -- Bắt buộc không cho phép nhập comment rỗng
  IF trim(p_content) = '' THEN
    RAISE EXCEPTION 'Content cannot be empty';
  END IF;

  -- Lưu comment mới với sender_type = 'supplier'
  INSERT INTO public.purchase_order_comments (
    tenant_id,
    purchase_order_id,
    content,
    sender_type,
    sender_name,
    created_at
  ) VALUES (
    v_po.tenant_id,
    v_po.id,
    p_content,
    'supplier',
    COALESCE(v_po.supplier_name_snapshot, 'Nhà cung cấp'),
    NOW()
  ) RETURNING id INTO v_comment_id;

  RETURN jsonb_build_object(
    'success', true,
    'comment_id', v_comment_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
