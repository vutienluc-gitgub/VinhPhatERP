-- =====================================================================================
-- Migration: Infrastructure for Sequential Background Jobs & Queue Locks
-- Vá lỗ hổng Race Condition khi xử lý Offline Queue và Edge Functions
-- =====================================================================================

-- 1. Tạo bảng hàng chờ (Background Jobs Queue)
CREATE TABLE IF NOT EXISTS public.background_jobs (
  id BIGSERIAL PRIMARY KEY,
  queue_name TEXT NOT NULL,
  target_entity_id UUID,          -- ID của entity cần thao tác (dùng để lock)
  target_entity_table TEXT,       -- Tên bảng của entity (vd: 'orders', 'shipments')
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_error TEXT,
  locked_at TIMESTAMPTZ,          -- Thời điểm bị lock bởi worker
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tenant_id UUID REFERENCES public.tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_background_jobs_queue_status 
ON public.background_jobs (queue_name, status, id ASC);

-- 2. Bật RLS và policies
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage background jobs" 
ON public.background_jobs FOR ALL TO service_role USING (true);

-- Cho phép nhân viên đẩy job vào hàng chờ
CREATE POLICY "Users can insert jobs" 
ON public.background_jobs FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Hàm lấy Job an toàn không bị Race Condition (Queue Lock: SKIP LOCKED)
-- Sử dụng FOR UPDATE SKIP LOCKED đảm bảo 2 Edge Functions không bao giờ lấy trùng 1 Job
CREATE OR REPLACE FUNCTION public.rpc_dequeue_job(p_queue_name TEXT)
RETURNS SETOF public.background_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.background_jobs
  SET status = 'processing',
      locked_at = now(),
      updated_at = now(),
      attempts = attempts + 1
  WHERE id = (
    SELECT id
    FROM public.background_jobs
    WHERE status = 'pending'
      AND queue_name = p_queue_name
      AND attempts < max_attempts
    ORDER BY id ASC
    FOR UPDATE SKIP LOCKED -- <<< KHÓA HÀNG CHỜ (QUEUE LOCK) TẠI ĐÂY
    LIMIT 1
  )
  RETURNING *;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_dequeue_job(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_dequeue_job(TEXT) TO authenticated;

-- 4. Hàm khóa Entity bằng Advisory Lock
-- Dùng để ép các thao tác đồng thời trên cùng 1 Entity phải xếp hàng chờ nhau
CREATE OR REPLACE FUNCTION public.rpc_acquire_entity_lock(p_entity_table TEXT, p_entity_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lock_id BIGINT;
BEGIN
  -- Hash chuỗi Tên Bảng + ID thành 1 số 64-bit để làm ID cho Advisory Lock
  v_lock_id := hashtext(p_entity_table || '::' || p_entity_id::TEXT);
  
  -- Lấy khóa cấp Transaction (Transaction-level advisory lock)
  -- Các Transaction khác gọi hàm này với cùng v_lock_id sẽ bị block cho đến khi Transaction hiện tại commit/rollback
  PERFORM pg_advisory_xact_lock(v_lock_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_acquire_entity_lock(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_acquire_entity_lock(TEXT, UUID) TO service_role;

-- 5. Hàm cập nhật trạng thái Job (Thành công / Thất bại)
CREATE OR REPLACE FUNCTION public.rpc_resolve_job(
  p_job_id BIGINT, 
  p_status TEXT, 
  p_error TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.background_jobs
  SET status = p_status,
      last_error = p_error,
      updated_at = now(),
      locked_at = NULL
  WHERE id = p_job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_resolve_job(BIGINT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_resolve_job(BIGINT, TEXT, TEXT) TO service_role;
