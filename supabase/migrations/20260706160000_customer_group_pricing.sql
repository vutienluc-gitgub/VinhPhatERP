-- Migration: Giá Theo Nhóm Khách Hàng (Many-to-Many Group Pricing)
-- Tạo danh mục nhóm khách hàng, cầu nối nhóm-khách hàng, cầu nối bậc giá-nhóm, cập nhật triggers và các hàm RPC.

-- 1. Tạo bảng danh mục nhóm khách hàng customer_groups
CREATE TABLE IF NOT EXISTS public.customer_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  status      TEXT CHECK (status IN ('active', 'inactive')) NOT NULL DEFAULT 'active',
  tenant_id   UUID REFERENCES public.tenants(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kích hoạt RLS cho customer_groups
ALTER TABLE public.customer_groups ENABLE ROW LEVEL SECURITY;

-- Tạo trigger tự động cập nhật updated_at
CREATE TRIGGER trg_customer_groups_updated_at
  BEFORE UPDATE ON public.customer_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS Policies cho customer_groups
CREATE POLICY customer_groups_select ON public.customer_groups
  FOR SELECT USING (true);

CREATE POLICY customer_groups_write ON public.customer_groups
  FOR ALL USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

-- 2. Tạo bảng cầu nối thành viên nhóm khách hàng customer_group_members (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.customer_group_members (
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  group_id    UUID REFERENCES public.customer_groups(id) ON DELETE RESTRICT,
  PRIMARY KEY (customer_id, group_id)
);

-- Kích hoạt RLS cho customer_group_members
ALTER TABLE public.customer_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies cho customer_group_members
CREATE POLICY customer_group_members_select ON public.customer_group_members
  FOR SELECT USING (true);

CREATE POLICY customer_group_members_write ON public.customer_group_members
  FOR ALL USING (
    group_id IN (
      SELECT id FROM public.customer_groups
    )
  );

-- 3. Cập nhật bảng fabric_pricing_tiers thêm cột priority
ALTER TABLE public.fabric_pricing_tiers
  ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0;

COMMENT ON COLUMN public.fabric_pricing_tiers.priority IS 'Độ ưu tiên của bậc giá khi có nhiều bậc trùng mốc số lượng';

-- 4. Tạo bảng cầu nối bậc giá và nhóm khách hàng fabric_pricing_tier_groups (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.fabric_pricing_tier_groups (
  pricing_tier_id   UUID REFERENCES public.fabric_pricing_tiers(id) ON DELETE CASCADE,
  customer_group_id UUID REFERENCES public.customer_groups(id) ON DELETE RESTRICT,
  PRIMARY KEY (pricing_tier_id, customer_group_id)
);

-- Kích hoạt RLS cho fabric_pricing_tier_groups
ALTER TABLE public.fabric_pricing_tier_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies cho fabric_pricing_tier_groups
CREATE POLICY fabric_pricing_tier_groups_select ON public.fabric_pricing_tier_groups
  FOR SELECT USING (true);

CREATE POLICY fabric_pricing_tier_groups_write ON public.fabric_pricing_tier_groups
  FOR ALL USING (
    pricing_tier_id IN (
      SELECT id FROM public.fabric_pricing_tiers
    )
  );

-- 5. Cập nhật trigger validation trùng lặp mốc giá theo nhóm khách hàng (Overlap check)
CREATE OR REPLACE FUNCTION public.trg_fn_validate_pricing_tier_moq()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_moq NUMERIC;
  v_overlap_exists BOOLEAN;
BEGIN
  -- Chỉ áp dụng xác thực đối với bậc giá hiển thị công khai
  IF NEW.is_public_visible IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  -- Lấy MOQ từ fabric_commercials
  SELECT minimum_order_qty_kg INTO v_moq
  FROM public.fabric_commercials
  WHERE fabric_catalog_id = NEW.fabric_catalog_id;

  IF v_moq IS NULL OR v_moq <= 0 THEN
    RETURN NEW;
  END IF;

  -- Xác thực: Số lượng tối thiểu của bậc giá công khai không được nhỏ hơn MOQ
  IF NEW.min_quantity < v_moq THEN
    RAISE EXCEPTION 'Số lượng tối thiểu của bậc giá công khai (% kg) không được nhỏ hơn MOQ (% kg)',
      NEW.min_quantity, v_moq;
  END IF;

  -- Kiểm tra trùng lặp mốc số lượng TRONG CÙNG ĐỐI TƯỢNG NHÓM KHÁCH HÀNG (giao nhau)
  SELECT EXISTS (
    SELECT 1 FROM public.fabric_pricing_tiers existing
    WHERE existing.fabric_catalog_id = NEW.fabric_catalog_id
      AND existing.id IS DISTINCT FROM NEW.id
      -- Kiểm tra giao mốc số lượng
      AND (
        (NEW.min_quantity >= existing.min_quantity AND (existing.max_quantity IS NULL OR NEW.min_quantity < existing.max_quantity))
        OR
        (NEW.max_quantity IS NOT NULL AND NEW.max_quantity > existing.min_quantity AND (existing.max_quantity IS NULL OR NEW.max_quantity <= existing.max_quantity))
        OR
        (NEW.min_quantity <= existing.min_quantity AND (NEW.max_quantity IS NULL OR (existing.max_quantity IS NOT NULL AND NEW.max_quantity >= existing.max_quantity)))
      )
      -- Kiểm tra trùng đối tượng nhóm khách hàng
      AND (
        (
          -- Cả hai đều là mốc giá chung (không thuộc nhóm nào)
          NOT EXISTS (SELECT 1 FROM public.fabric_pricing_tier_groups g WHERE g.pricing_tier_id = NEW.id)
          AND
          NOT EXISTS (SELECT 1 FROM public.fabric_pricing_tier_groups g WHERE g.pricing_tier_id = existing.id)
        )
        OR
        (
          -- Hoặc có chung ít nhất 1 nhóm khách hàng
          EXISTS (
            SELECT 1 FROM public.fabric_pricing_tier_groups g1
            INNER JOIN public.fabric_pricing_tier_groups g2 ON g1.customer_group_id = g2.customer_group_id
            WHERE g1.pricing_tier_id = NEW.id AND g2.pricing_tier_id = existing.id
          )
        )
      )
  ) INTO v_overlap_exists;

  IF v_overlap_exists THEN
    RAISE EXCEPTION 'Bậc giá bị trùng lắp phạm vi số lượng với bậc giá khác có cùng đối tượng nhóm (min: % kg)',
      NEW.min_quantity;
  END IF;

  RETURN NEW;
END;
$$;

-- 6. Nâng cấp hàm RPC lấy bảng giá sỉ rpc_get_fabric_pricing_tiers
CREATE OR REPLACE FUNCTION public.rpc_get_fabric_pricing_tiers(p_fabric_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_role public.user_role;
  v_customer_id UUID;
  v_user_group_ids UUID[] := '{}'::UUID[];
  v_show_all BOOLEAN := false;
BEGIN
  -- 1. Xác định vai trò người xem
  IF auth.uid() IS NOT NULL THEN
    SELECT role, customer_id INTO v_role, v_customer_id FROM public.profiles WHERE id = auth.uid();
    
    -- Nhân viên nội bộ xem được tất cả
    IF v_role IN ('admin', 'manager', 'staff', 'sale') THEN
      v_show_all := true;
    ELSIF v_role = 'customer' AND v_customer_id IS NOT NULL THEN
      -- Khách hàng: Lấy danh sách ID nhóm mà họ trực thuộc
      SELECT COALESCE(array_agg(group_id), '{}'::UUID[]) INTO v_user_group_ids
      FROM public.customer_group_members
      WHERE customer_id = v_customer_id;
    END IF;
  END IF;

  -- 2. Truy vấn bậc giá theo phân quyền (Authorization) và trạng thái hiển thị (Visibility)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'min_quantity', min_quantity,
      'max_quantity', max_quantity,
      'unit_price', unit_price,
      'currency', currency,
      'display_label', display_label,
      'is_public_visible', is_public_visible,
      'priority', priority,
      'customer_group_ids', customer_group_ids
    )
  ) INTO v_result
  FROM (
    SELECT 
      t.id, 
      t.min_quantity, 
      t.max_quantity, 
      t.unit_price, 
      t.currency, 
      t.display_label, 
      t.is_public_visible,
      t.priority,
      COALESCE(
        (
          SELECT jsonb_agg(customer_group_id) 
          FROM public.fabric_pricing_tier_groups tg 
          WHERE tg.pricing_tier_id = t.id
        ), 
        '[]'::jsonb
      ) AS customer_group_ids
    FROM public.fabric_pricing_tiers t
    WHERE t.fabric_catalog_id = p_fabric_id
      AND (
        v_show_all -- Nhân viên xem hết
        OR (
          -- Phân quyền Authorization
          (
            -- Mốc giá chung (không gán nhóm nào)
            NOT EXISTS (SELECT 1 FROM public.fabric_pricing_tier_groups tg WHERE tg.pricing_tier_id = t.id)
            OR
            -- Hoặc mốc giá gán cho nhóm mà người dùng trực thuộc
            EXISTS (
              SELECT 1 FROM public.fabric_pricing_tier_groups tg 
              WHERE tg.pricing_tier_id = t.id AND tg.customer_group_id = ANY(v_user_group_ids)
            )
          )
          AND
          -- Trạng thái hiển thị Visibility
          (
            (auth.uid() IS NOT NULL) -- Đăng nhập xem được cả ẩn lẫn hiện
            OR (t.is_public_visible = true) -- Ẩn danh chỉ xem được mốc công khai
          )
        )
      )
    ORDER BY t.priority DESC, t.min_quantity ASC
  ) t;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 7. Nâng cấp hàm RPC cập nhật bảng giá rpc_update_fabric_pricing_tiers từ Admin
CREATE OR REPLACE FUNCTION public.rpc_update_fabric_pricing_tiers(
  p_fabric_id UUID,
  p_tiers JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_moq NUMERIC;
  v_tier JSONB;
  v_tier_i JSONB;
  v_tier_j JSONB;
  v_new_tier_id UUID;
  
  -- Các biến hỗ trợ kiểm thử trùng lặp
  v_min_qty_i NUMERIC;
  v_max_qty_i NUMERIC;
  v_is_public_i BOOLEAN;
  v_group_ids_i UUID[];
  
  v_min_qty_j NUMERIC;
  v_max_qty_j NUMERIC;
  v_group_ids_j UUID[];
  
  i INTEGER;
  j INTEGER;
BEGIN
  -- Lấy tenant_id và MOQ hiện tại của sản phẩm vải
  SELECT tenant_id INTO v_tenant_id FROM public.fabric_catalogs WHERE id = p_fabric_id;
  SELECT minimum_order_qty_kg INTO v_moq FROM public.fabric_commercials WHERE fabric_catalog_id = p_fabric_id;
  v_moq := COALESCE(v_moq, 0);

  -- A. Tiền kiểm thử (Pre-validation) tất cả các bậc giá trước khi thay đổi dữ liệu thật
  IF p_tiers IS NOT NULL AND jsonb_array_length(p_tiers) > 0 THEN
    FOR i IN 0..jsonb_array_length(p_tiers) - 1 LOOP
      v_tier_i := p_tiers->i;
      v_min_qty_i := (v_tier_i->>'min_quantity')::NUMERIC;
      v_max_qty_i := NULLIF((v_tier_i->>'max_quantity'), '')::NUMERIC;
      v_is_public_i := COALESCE((v_tier_i->>'is_public_visible')::BOOLEAN, TRUE);
      
      -- Phân tách danh sách nhóm của bậc i
      SELECT COALESCE(
        array_agg(value::UUID) FILTER (WHERE value IS NOT NULL),
        '{}'::UUID[]
      ) INTO v_group_ids_i
      FROM jsonb_array_elements_text(COALESCE(v_tier_i->'customer_group_ids', '[]'::jsonb));

      -- Kiểm tra điều kiện MOQ đối với bậc công khai
      IF v_is_public_i AND v_moq > 0 AND v_min_qty_i < v_moq THEN
        RAISE EXCEPTION 'Bậc giá công khai #% có số lượng tối thiểu (% kg) nhỏ hơn MOQ (% kg)',
          i + 1, v_min_qty_i, v_moq;
      END IF;

      -- Đối chiếu trùng lặp số lượng với các bậc trước đó
      IF i > 0 THEN
        FOR j IN 0..i-1 LOOP
          v_tier_j := p_tiers->j;
          v_min_qty_j := (v_tier_j->>'min_quantity')::NUMERIC;
          v_max_qty_j := NULLIF((v_tier_j->>'max_quantity'), '')::NUMERIC;
          
          -- Phân tách danh sách nhóm của bậc j
          SELECT COALESCE(
            array_agg(value::UUID) FILTER (WHERE value IS NOT NULL),
            '{}'::UUID[]
          ) INTO v_group_ids_j
          FROM jsonb_array_elements_text(COALESCE(v_tier_j->'customer_group_ids', '[]'::jsonb));

          -- Nếu hai bậc giá có trùng giao nhóm khách hàng (hoặc cả 2 đều là bậc chung)
          IF (cardinality(v_group_ids_i) = 0 AND cardinality(v_group_ids_j) = 0)
             OR (v_group_ids_i && v_group_ids_j) THEN
            
            -- Kiểm tra trùng khoảng số lượng
            IF (v_min_qty_i >= v_min_qty_j AND (v_max_qty_j IS NULL OR v_min_qty_i < v_max_qty_j))
               OR (v_max_qty_i IS NOT NULL AND v_max_qty_i > v_min_qty_j AND (v_max_qty_j IS NULL OR v_max_qty_i <= v_max_qty_j))
               OR (v_min_qty_i <= v_min_qty_j AND (v_max_qty_i IS NULL OR (v_max_qty_j IS NOT NULL AND v_max_qty_i >= v_max_qty_j))) THEN
              RAISE EXCEPTION 'Bậc giá #% bị trùng lắp phạm vi số lượng với bậc giá #% dành cho cùng nhóm khách hàng',
                i + 1, j + 1;
            END IF;
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- B. Dọn dẹp dữ liệu cũ
  -- Xóa liên kết nhóm của các bậc giá vải hiện hành
  DELETE FROM public.fabric_pricing_tier_groups 
  WHERE pricing_tier_id IN (
    SELECT id FROM public.fabric_pricing_tiers WHERE fabric_catalog_id = p_fabric_id
  );

  -- Xóa các bậc giá cũ
  DELETE FROM public.fabric_pricing_tiers WHERE fabric_catalog_id = p_fabric_id;

  -- C. Ghi nhận dữ liệu mới
  IF p_tiers IS NOT NULL AND jsonb_array_length(p_tiers) > 0 THEN
    FOR v_tier IN SELECT * FROM jsonb_array_elements(p_tiers)
    LOOP
      INSERT INTO public.fabric_pricing_tiers (
        fabric_catalog_id,
        min_quantity,
        max_quantity,
        unit_price,
        currency,
        display_label,
        is_public_visible,
        priority,
        tenant_id
      ) VALUES (
        p_fabric_id,
        (v_tier->>'min_quantity')::NUMERIC,
        NULLIF((v_tier->>'max_quantity'), '')::NUMERIC,
        (v_tier->>'unit_price')::NUMERIC,
        COALESCE(v_tier->>'currency', 'VND'),
        NULLIF((v_tier->>'display_label'), ''),
        COALESCE((v_tier->>'is_public_visible')::BOOLEAN, TRUE),
        COALESCE((v_tier->>'priority')::INTEGER, 0),
        v_tenant_id
      ) RETURNING id INTO v_new_tier_id;

      -- Chèn các liên kết nhóm khách hàng vào bảng cầu nối
      IF v_tier->'customer_group_ids' IS NOT NULL AND jsonb_array_length(v_tier->'customer_group_ids') > 0 THEN
        INSERT INTO public.fabric_pricing_tier_groups (pricing_tier_id, customer_group_id)
        SELECT v_new_tier_id, value::UUID
        FROM jsonb_array_elements_text(v_tier->'customer_group_ids')
        WHERE value IS NOT NULL;
      END IF;
    END LOOP;
  END IF;
END;
$$;
