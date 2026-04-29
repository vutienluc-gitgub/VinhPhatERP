-- ============================================================
-- Role-Permission System (Granular RBAC)
-- ============================================================
-- Hệ thống phân quyền chi tiết: Role → Permission → Action
-- Mỗi role có thể bật/tắt từng permission cụ thể.
-- ============================================================

-- 1. Bảng permissions — danh mục tất cả quyền trong hệ thống
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,          -- VD: 'orders:read', 'orders:create'
  module text NOT NULL,              -- VD: 'orders', 'inventory', 'settings'
  action text NOT NULL,              -- VD: 'read', 'create', 'update', 'delete'
  label text NOT NULL,               -- VD: 'Xem đơn hàng'
  description text DEFAULT '',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. Bảng role_permissions — junction table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT (current_setting('app.tenant_id', true))::uuid,
  role text NOT NULL,                -- user_role enum value
  permission_key text NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  granted boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (tenant_id, role, permission_key)
);

-- 3. RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- permissions là global read (tất cả user đều thấy danh mục quyền)
CREATE POLICY "permissions_read_all" ON public.permissions
  FOR SELECT USING (true);

-- role_permissions: tenant isolation
CREATE POLICY "rp_tenant_read" ON public.role_permissions
  FOR SELECT USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);

CREATE POLICY "rp_tenant_write" ON public.role_permissions
  FOR ALL USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_role_permissions_lookup
  ON public.role_permissions(tenant_id, role);

-- 5. Seed permissions — danh mục quyền mặc định
INSERT INTO public.permissions (key, module, action, label, sort_order) VALUES
  -- Đơn hàng
  ('orders:read',      'orders',      'read',   'Xem đơn hàng',       100),
  ('orders:create',    'orders',      'create', 'Tạo đơn hàng',       101),
  ('orders:update',    'orders',      'update', 'Sửa đơn hàng',       102),
  ('orders:delete',    'orders',      'delete', 'Xóa đơn hàng',       103),
  -- Báo giá
  ('quotations:read',  'quotations',  'read',   'Xem báo giá',        200),
  ('quotations:create','quotations',  'create', 'Tạo báo giá',        201),
  ('quotations:export','quotations',  'export', 'Xuất PDF báo giá',   202),
  -- Sản xuất
  ('work_orders:read',   'production', 'read',   'Xem lệnh sản xuất', 300),
  ('work_orders:create', 'production', 'create', 'Tạo lệnh sản xuất', 301),
  ('work_orders:update', 'production', 'update', 'Sửa lệnh sản xuất', 302),
  ('looms:manage',       'production', 'manage', 'Quản lý máy dệt',   303),
  -- Kho
  ('inventory:read',   'inventory',   'read',   'Xem tồn kho',        400),
  ('inventory:import', 'inventory',   'import', 'Nhập kho',           401),
  ('inventory:export', 'inventory',   'export', 'Xuất kho',           402),
  -- Tài chính
  ('payments:read',    'finance',     'read',   'Xem thanh toán',     500),
  ('payments:create',  'finance',     'create', 'Tạo thanh toán',     501),
  ('debts:read',       'finance',     'read',   'Xem công nợ',        502),
  ('reports:read',     'finance',     'read',   'Xem báo cáo',        503),
  ('reports:export',   'finance',     'export', 'Xuất báo cáo',       504),
  -- Giao hàng
  ('shipments:read',          'shipments', 'read',   'Xem giao hàng',          600),
  ('shipments:create',        'shipments', 'create', 'Tạo phiếu giao hàng',    601),
  ('shipments:update_status', 'shipments', 'update', 'Cập nhật trạng thái GH', 602),
  -- Hệ thống
  ('settings:read',    'system',      'read',   'Xem cài đặt',        900),
  ('settings:write',   'system',      'write',  'Chỉnh sửa cài đặt', 901),
  ('users:manage',     'system',      'manage', 'Quản lý người dùng', 902)
ON CONFLICT (key) DO NOTHING;

-- 6. RPC: Lấy permissions của user hiện tại dựa trên role
CREATE OR REPLACE FUNCTION public.rpc_get_user_permissions(p_role text)
RETURNS TABLE(permission_key text, granted boolean) AS $$
BEGIN
  RETURN QUERY
    SELECT rp.permission_key, rp.granted
    FROM public.role_permissions rp
    WHERE rp.tenant_id = (current_setting('app.tenant_id', true))::uuid
      AND rp.role = p_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: Admin cập nhật permission cho 1 role
CREATE OR REPLACE FUNCTION public.rpc_upsert_role_permissions(
  p_role text,
  p_permissions jsonb  -- [{"key": "orders:read", "granted": true}, ...]
)
RETURNS void AS $$
DECLARE
  perm jsonb;
  v_tenant_id uuid := (current_setting('app.tenant_id', true))::uuid;
BEGIN
  FOR perm IN SELECT * FROM jsonb_array_elements(p_permissions)
  LOOP
    INSERT INTO public.role_permissions (tenant_id, role, permission_key, granted, updated_at)
    VALUES (
      v_tenant_id,
      p_role,
      perm->>'key',
      (perm->>'granted')::boolean,
      now()
    )
    ON CONFLICT (tenant_id, role, permission_key)
    DO UPDATE SET granted = (perm->>'granted')::boolean, updated_at = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
