# 🏛️ Supplier Domain Refactoring Specification v1.0

## Tách lớp: Category ➔ Capability ➔ Portal Entitlement

- **Dự án:** VinhPhatERP v3
- **Phiên bản:** 1.0.0
- **Chủ sở hữu (Owner):** System Architect & Core ERP Team
- **Trạng thái:** Proposed / Ready for Review & Implementation
- **Phạm vi tác động:** `suppliers`, `supplier-portal`, `work-orders`, `weaving-invoices`, `looms`, `v_supplier_debt`

---

## 1. Bối cảnh & Vấn đề Cốt lõi (Problem Statement)

### 1.1. Hiện trạng kiến trúc

Trước đây, bảng `suppliers` sử dụng một trường duy nhất:

```sql
suppliers.category VARCHAR(50)
```

Trường này đang bị gánh **3 trách nhiệm độc lập**:

1. **Phân loại kinh doanh / Danh mục hàng hóa** (Kế toán, mua sắm)
2. **Năng lực kỹ thuật / Sản xuất thực tế** (Điều phối Lệnh dệt, gán máy dệt, nghiệm thu gia công)
3. **Phân quyền và điều hướng luồng giao diện trên Portal** (Sidebar menu, quyền xem PO vs Work Order)

### 1.2. Bug nghiệp vụ nghiêm trọng đã xác định

Tại [`src/features/supplier-portal/SupplierPortalLayout.tsx:L45`](file:///d:/VinhPhatERP_v3/src/features/supplier-portal/SupplierPortalLayout.tsx#L45):

```tsx
const isSubcontractor =
  supplier?.category === 'weaving' || supplier?.category === 'dyeing';
```

Trong khi đó, cơ sở dữ liệu đã chuẩn hóa 108 NCC thành các mã: `YARN`, `GREIGE`, `FINISHED_FABRIC`, `CHEMICAL`, `TRIM`, `OUTSOURCING`, `SERVICE`, `OTHER`.

- **Hậu quả:** Không có bất kỳ NCC nào có giá trị chuỗi `'weaving'` hay `'dyeing'`. Biến cờ `isSubcontractor` **luôn luôn trả về `false`**, khiến **100% đối tác gia công** (như Kiều Vinh, Ý Vinh) bị ép sang giao diện mua bán thương mại (PO/RFQ), hoàn toàn không thấy module Lệnh gia công và Nhận vật tư.
- Đồng thời, [`WorkOrderForm.tsx`](file:///d:/VinhPhatERP_v3/src/features/work-orders/WorkOrderForm.tsx#L78) và [`fetchWeavingSuppliers`](file:///d:/VinhPhatERP_v3/src/api/weaving-invoices.api.ts#L102) lại hardcode `category: 'GREIGE'`, tước quyền nhận lệnh dệt của toàn bộ nhóm `OUTSOURCING`.

---

## 2. Nguyên tắc Thiết kế Mục tiêu (Core Architectural Axioms)

Hệ thống phân định rạch ròi 3 câu hỏi bằng 3 tầng dữ liệu riêng biệt:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. CATEGORY (1 : 1)                                                    │
│    "NCC này thuộc nhóm quản lý / hàng hóa chính nào?"                  │
│    → Phục vụ: Báo cáo kế toán, phân loại danh bạ, master data           │
│    → Giá trị: YARN, GREIGE, FINISHED_FABRIC, CHEMICAL, TRIM, SERVICE   │
├────────────────────────────────────────────────────────────────────────┤
│ 2. CAPABILITIES (1 : N)                                                │
│    "NCC này có năng lực kỹ thuật / sản xuất gì?"                      │
│    → Phục vụ: Gán lệnh dệt, gán máy dệt, nghiệm thu gia công, tìm kiếm  │
│    → Giá trị: WEAVING, KNITTING, DYEING, PRINTING, SUPPLY_YARN...      │
├────────────────────────────────────────────────────────────────────────┤
│ 3. PORTAL ENTITLEMENTS (1 : N)                                         │
│    "NCC này được phép xem và thao tác gì trên Supplier Portal?"        │
│    → Phục vụ: Sidebar navigation, Route guards, RBAC, Action controls  │
│    → Giá trị: VIEW_PO, VIEW_WORK_ORDER, REPORT_PROGRESS, VIEW_DEBT...  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Lộ trình Triển khai 3 Giai đoạn (Implementation Roadmap)

```text
Phase 1: Stabilize & Hotfix
├── Sửa bug SupplierPortalLayout (nhận diện đúng OUTSOURCING & GREIGE)
├── Sửa filter WorkOrderForm & fetchWeavingSuppliers (cho phép cả OUTSOURCING)
└── Chuẩn hóa QuickSupplierForm defaultCategory (loại bỏ chuỗi rác 'weaving')
       │
       ▼
Phase 2: Supplier Capability Subsystem
├── Tạo bảng supplier_capabilities & migration backfill 108 NCC hiện hữu
├── Bổ sung Domain Types & API: fetchSuppliersByCapability('WEAVING')
├── Cập nhật WorkOrderForm, LoomForm, WeavingInvoices dùng Capability Hook
└── Sửa SQL view v_supplier_debt (loại bỏ filter cứng category IN ('GREIGE', 'YARN'))
       │
       ▼
Phase 3: Portal Entitlement Subsystem
├── Thiết lập bảng / hàm phân giải Entitlements từ Capabilities + Overrides
├── Chuyển đổi SupplierPortalLayout sang Dynamic Navigation Engine
└── Áp dụng Route Guards cho từng module Portal (Work Orders, POs, Invoices, ePOD)
```

---

## 4. Chi tiết Kỹ thuật Từng Giai đoạn

### Giai đoạn 1: Ổn định & Vá lỗi khẩn cấp (Stabilize - Không sửa DB Schema)

Mục tiêu: Đưa hệ thống về trạng thái hoạt động đúng ngay lập tức, không thay đổi schema DB.

#### 1.1. Sửa nhận diện Subcontractor trong Supplier Portal

- **File:** [`src/features/supplier-portal/SupplierPortalLayout.tsx`](file:///d:/VinhPhatERP_v3/src/features/supplier-portal/SupplierPortalLayout.tsx)
- **Logic mới:**
  ```tsx
  // Chấp nhận cả mã danh mục hiện tại và tương thích ngược
  const isSubcontractor =
    supplier?.category === 'OUTSOURCING' ||
    supplier?.category === 'GREIGE' ||
    supplier?.category === 'weaving' ||
    supplier?.category === 'dyeing';
  ```

#### 1.2. Mở rộng bộ lọc xưởng dệt trong Lệnh gia công & Phiếu dệt

- **File:** [`src/features/work-orders/WorkOrderForm.tsx`](file:///d:/VinhPhatERP_v3/src/features/work-orders/WorkOrderForm.tsx)
  - Cho phép chọn cả NCC `GREIGE` và `OUTSOURCING`.
- **File:** [`src/api/weaving-invoices.api.ts:fetchWeavingSuppliers`](file:///d:/VinhPhatERP_v3/src/api/weaving-invoices.api.ts#L96-L107)
  - Đổi query từ `.eq('category', 'GREIGE')` thành `.in('category', ['GREIGE', 'OUTSOURCING'])`.

#### 1.3. Chuẩn hóa giá trị mặc định khi tạo nhanh

- **File:** [`src/features/raw-fabric/RawFabricForm.tsx:L380`](file:///d:/VinhPhatERP_v3/src/features/raw-fabric/RawFabricForm.tsx#L380)
  - Đổi `defaultCategory="weaving"` thành `defaultCategory="GREIGE"`.

---

### Giai đoạn 2: Xây dựng Tầng Năng lực (Supplier Capability Subsystem)

#### 2.1. Cơ sở dữ liệu (Database Migration)

Tạo file migration: `supabase/migrations/20260505000001_supplier_capabilities.sql`

```sql
-- 1. Bảng danh mục năng lực chuẩn
CREATE TABLE IF NOT EXISTS supplier_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    capability_code VARCHAR(50) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(supplier_id, capability_code)
);

CREATE INDEX idx_supplier_capabilities_lookup
ON supplier_capabilities(capability_code, is_verified);

-- 2. RLS Policies
ALTER TABLE supplier_capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read to authenticated" ON supplier_capabilities
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow manage to internal users" ON supplier_capabilities
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
              AND role NOT IN ('customer', 'supplier')
        )
    );

-- 3. Data Backfill tự động cho 108 NCC hiện hữu
-- YARN -> SUPPLY_YARN
INSERT INTO supplier_capabilities (supplier_id, tenant_id, capability_code, is_verified)
SELECT id, tenant_id, 'SUPPLY_YARN', true FROM suppliers WHERE category = 'YARN'
ON CONFLICT DO NOTHING;

-- GREIGE -> SUPPLY_GREIGE & WEAVING
INSERT INTO supplier_capabilities (supplier_id, tenant_id, capability_code, is_verified)
SELECT id, tenant_id, 'SUPPLY_GREIGE', true FROM suppliers WHERE category = 'GREIGE'
ON CONFLICT DO NOTHING;
INSERT INTO supplier_capabilities (supplier_id, tenant_id, capability_code, is_verified)
SELECT id, tenant_id, 'WEAVING', true FROM suppliers WHERE category = 'GREIGE'
ON CONFLICT DO NOTHING;

-- OUTSOURCING -> WEAVING & DYEING
INSERT INTO supplier_capabilities (supplier_id, tenant_id, capability_code, is_verified)
SELECT id, tenant_id, 'WEAVING', true FROM suppliers WHERE category = 'OUTSOURCING'
ON CONFLICT DO NOTHING;
INSERT INTO supplier_capabilities (supplier_id, tenant_id, capability_code, is_verified)
SELECT id, tenant_id, 'DYEING', true FROM suppliers WHERE category = 'OUTSOURCING'
ON CONFLICT DO NOTHING;

-- FINISHED_FABRIC -> SUPPLY_FINISHED_FABRIC
INSERT INTO supplier_capabilities (supplier_id, tenant_id, capability_code, is_verified)
SELECT id, tenant_id, 'SUPPLY_FINISHED_FABRIC', true FROM suppliers WHERE category = 'FINISHED_FABRIC'
ON CONFLICT DO NOTHING;

-- CHEMICAL -> SUPPLY_CHEMICAL
INSERT INTO supplier_capabilities (supplier_id, tenant_id, capability_code, is_verified)
SELECT id, tenant_id, 'SUPPLY_CHEMICAL', true FROM suppliers WHERE category = 'CHEMICAL'
ON CONFLICT DO NOTHING;

-- TRIM -> SUPPLY_TRIM
INSERT INTO supplier_capabilities (supplier_id, tenant_id, capability_code, is_verified)
SELECT id, tenant_id, 'SUPPLY_TRIM', true FROM suppliers WHERE category = 'TRIM'
ON CONFLICT DO NOTHING;
```

#### 2.2. Domain Types & Constants

- **File:** `src/domain/crm/suppliers.types.ts`

  ```typescript
  export const SUPPLIER_CAPABILITY_CODES = [
    'WEAVING',
    'KNITTING',
    'DYEING',
    'PRINTING',
    'SUPPLY_YARN',
    'SUPPLY_GREIGE',
    'SUPPLY_FINISHED_FABRIC',
    'SUPPLY_CHEMICAL',
    'SUPPLY_TRIM',
    'LOGISTICS',
    'MAINTENANCE',
  ] as const;

  export type SupplierCapabilityCode =
    (typeof SUPPLIER_CAPABILITY_CODES)[number];

  export interface SupplierCapability {
    id: string;
    supplier_id: string;
    capability_code: SupplierCapabilityCode;
    is_verified: boolean;
    notes?: string | null;
  }
  ```

#### 2.3. Data Access & Application Hooks

- **File:** `src/api/suppliers.api.ts`

  ```typescript
  export async function fetchSuppliersByCapability(
    capability: SupplierCapabilityCode,
  ): Promise<Supplier[]> {
    const { data, error } = await untypedDb
      .from('suppliers')
      .select('*, supplier_capabilities!inner(capability_code)')
      .eq('status', 'active')
      .eq('supplier_capabilities.capability_code', capability)
      .order('name');

    if (error) throw error;
    return (data ?? []) as Supplier[];
  }
  ```

- **File:** `src/application/crm/useSuppliers.ts`
  ```typescript
  export function useSuppliersByCapability(capability: SupplierCapabilityCode) {
    return useQuery({
      queryKey: ['suppliers', 'by-capability', capability],
      queryFn: () => fetchSuppliersByCapability(capability),
      staleTime: 5 * 60 * 1000,
    });
  }
  ```

#### 2.4. Sửa View Công nợ Toàn diện (`v_supplier_debt`)

Xóa bỏ đoạn filter gây thất thoát công nợ:

```sql
-- CŨ:
WHERE s.category IN ('GREIGE', 'YARN')

-- MỚI: Không lọc theo category, mà lọc theo bất kỳ đối tác nào có giao dịch tài chính
WHERE (wit.supplier_id IS NOT NULL
    OR yrt.supplier_id IS NOT NULL
    OR et.supplier_id IS NOT NULL
    OR wot.supplier_id IS NOT NULL)
```

---

### Giai đoạn 3: Tầng Phân quyền Portal (Portal Entitlement Subsystem)

#### 3.1. Danh mục Quyền Portal (Entitlements Definition)

```typescript
export const PORTAL_ENTITLEMENTS = [
  'VIEW_PO', // Xem và phản hồi PO
  'VIEW_RFQ', // Tham gia chào giá RFQ
  'VIEW_WORK_ORDER', // Xem và báo cáo lệnh gia công
  'CONFIRM_MATERIAL', // Nhận và đối soát vật tư bàn giao
  'SUBMIT_INVOICE', // Nộp bảng kê / đề nghị thanh toán
  'VIEW_DEBT', // Đối soát công nợ
  'CONFIRM_DELIVERY', // Giao nhận số (ePOD)
] as const;

export type PortalEntitlement = (typeof PORTAL_ENTITLEMENTS)[number];
```

#### 3.2. Bộ giải mã quyền tự động (Entitlement Resolver Engine)

- **File:** `src/features/supplier-portal/utils/entitlementResolver.ts`

  ```typescript
  export function resolveSupplierEntitlements(
    capabilities: SupplierCapabilityCode[],
  ): Set<PortalEntitlement> {
    const entitlements = new Set<PortalEntitlement>();

    // Mặc định mọi đối tác đều được xem công nợ và hồ sơ của mình
    entitlements.add('VIEW_DEBT');
    entitlements.add('SUBMIT_INVOICE');

    // Năng lực gia công -> Mở module Work Order & Material Receipts
    if (
      capabilities.some((c) =>
        ['WEAVING', 'KNITTING', 'DYEING', 'PRINTING'].includes(c),
      )
    ) {
      entitlements.add('VIEW_WORK_ORDER');
      entitlements.add('CONFIRM_MATERIAL');
    }

    // Năng lực cung ứng vật tư/hàng hóa -> Mở module PO, RFQ, Giao nhận
    if (capabilities.some((c) => c.startsWith('SUPPLY_'))) {
      entitlements.add('VIEW_PO');
      entitlements.add('VIEW_RFQ');
      entitlements.add('CONFIRM_DELIVERY');
    }

    // Năng lực vận tải -> Chỉ mở module Giao nhận ePOD
    if (capabilities.includes('LOGISTICS')) {
      entitlements.add('CONFIRM_DELIVERY');
      entitlements.delete('VIEW_PO'); // Bảo vệ bảo mật: Không thấy giá trị PO
    }

    return entitlements;
  }
  ```

#### 3.3. Menu Động theo Entitlement trong `SupplierPortalLayout.tsx`

Thay thế 2 mảng cố định (Subcontractor vs Trader) bằng menu tự sinh theo phân quyền:

```tsx
const navItems: NavItem[] = [
  { to: '/portal/supplier', label: 'Tổng quan', end: true, icon: 'home' },

  ...(entitlements.has('VIEW_WORK_ORDER')
    ? [
        {
          to: '/portal/supplier/work-orders',
          label: 'Lệnh gia công',
          icon: 'package',
        },
      ]
    : []),

  ...(entitlements.has('CONFIRM_MATERIAL')
    ? [
        {
          to: '/portal/supplier/material-receipts',
          label: 'Nhận vật tư',
          icon: 'truck',
        },
      ]
    : []),

  ...(entitlements.has('VIEW_PO')
    ? [
        {
          to: '/portal/supplier/orders',
          label: 'Đơn hàng (PO)',
          icon: 'package',
        },
      ]
    : []),

  ...(entitlements.has('VIEW_RFQ')
    ? [
        {
          to: '/portal/supplier/quotations',
          label: 'Báo giá (RFQ)',
          icon: 'file-question',
        },
      ]
    : []),

  ...(entitlements.has('CONFIRM_DELIVERY')
    ? [
        {
          to: '/portal/supplier/deliveries',
          label: 'Giao hàng',
          icon: 'truck',
        },
      ]
    : []),

  ...(entitlements.has('SUBMIT_INVOICE')
    ? [
        {
          to: '/portal/supplier/invoices',
          label: 'Hóa đơn',
          icon: 'file-text',
        },
      ]
    : []),

  ...(entitlements.has('VIEW_DEBT')
    ? [
        {
          to: '/portal/supplier/debt',
          label: 'Công nợ',
          icon: 'calculator',
        },
      ]
    : []),

  { to: '/portal/supplier/profile', label: 'Hồ sơ', icon: 'user' },
];
```

---

## 5. Kiến trúc Kiểm định & Bảo vệ (Architecture Guard & Tests)

Để bảo đảm không tái diễn lỗi dùng `category` thay cho `capability`, thiết lập các rào chắn:

1. **ESLint Architecture Guard:**
   - Cấm sử dụng so sánh `supplier.category === 'weaving'` hoặc `supplier.category === 'dyeing'`.
   - Cấm truyền `{ category: '...' }` vào các form điều phối sản xuất (`WorkOrderForm`, `LoomForm`). Bắt buộc dùng `useSuppliersByCapability(...)`.
2. **Unit Tests:**
   - `suppliers.capabilities.test.ts`: Kiểm tra việc gán và truy vấn capabilities.
   - `entitlementResolver.test.ts`: Kiểm tra các kịch bản NCC Hybrid (vừa bán vải vừa nhận nhuộm), NCC thuần vận tải, NCC gia công.
3. **Database Guard Check (`npm run rpc:check`):**
   - Đảm bảo mọi function RPC liên quan đến gán xưởng hoặc gán máy dệt đều kiểm tra capability hợp lệ.

---

## 6. Kế hoạch Kiểm tra & Nghiệm thu (Verification Loop)

Khi triển khai code thực tế, bắt buộc thỏa mãn 4 lệnh kiểm tra chuẩn của dự án:

```bash
npm run rpc:check                  # 0 issues
npm run typecheck                  # 0 errors
npm run lint -- --max-warnings=0   # 0 warnings
npm run lint:css                   # 0 CSS errors
```
