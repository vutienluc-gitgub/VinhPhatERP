# Đề xuất Thay đổi (Change Proposal): Rà soát & Chuyển đổi Server-Side Pagination

- **Slug:** `server-side-pagination-audit`
- **Author:** Antigravity AI Assistant & Engineering Team
- **Trạng thái:** PENDING GATE 1
- **Domain:** [inventory | crm | procurement]
- **Tham chiếu Kỹ thuật:** Skill [`bigdata-perf`](file:///d:/VinhPhatERP_v3/.agents/skills/bigdata-perf/SKILL.md) & [AI_WORKFLOW.md](file:///d:/VinhPhatERP_v3/AI_WORKFLOW.md)

---

## 1. Bối cảnh & Lý do thay đổi (Context & Why)

### Hiện trạng rà soát (Audit Findings):

Sau khi quét tự động toàn bộ 57 API files và 33 List views trong `src/`:

1. **17 Phân hệ đã có Server-Side Pagination chuẩn (`.range()` + `{ count: 'exact' }`):**
   `yarn-receipts`, `raw-fabric`, `finished-fabric`, `fabric-catalog`, `yarn-catalog`, `dyeing-orders`, `work-orders`, `orders`, `quotations`, `shipments`, `payments`, `suppliers`, `weaving-invoices`, `looms`, `crm`, `purchase-requests`, `rfqs`.
2. **Các phân hệ tồn tại bẫy hiệu năng (Cần khắc phục ngay):**
   - **🔴 `customers` (Khách hàng - Fake Pagination):** `src/api/customers.api.ts` fetch toàn bộ khách hàng bằng `.select('*')`, sau đó `src/application/crm/useCustomers.ts` thực hiện `data.slice(from, from + pageSize)` trên máy client. Khi dữ liệu lên đến hàng nghìn khách hàng, trình duyệt sẽ tải JSON rất nặng và gây đơ UI.
   - **🔴 `purchase-orders` (Đơn mua hàng PO):** `src/api/purchase-orders.api.ts` gọi view `v_po_detail_full` với `.select('*')` không hề có `.range()`, tải toàn bộ lịch sử đơn mua hàng.
   - **🔴 `inventory` (Điều chỉnh kho):** `fetchInventoryAdjustments()` lấy toàn bộ lịch sử điều chỉnh kho theo thời gian thực mà không có phân trang.

### Mục tiêu đề xuất:

- Tái cấu trúc chuyển đổi **3 phân hệ trọng yếu (`customers`, `purchase-orders`, `inventory-adjustments`)** sang cơ chế **Server-Side Pagination chuẩn mực** (`.range(from, to)`, `count: 'exact'`, TanStack Query cache phân trang).
- Loại bỏ triệt để hiện tượng Client-side slicing (`data.slice()`).

---

## 2. Bản đồ Tác động (Impact Map)

```text
UI:
  ├── src/features/customers/CustomerList.tsx
  ├── src/features/procurement/purchase-orders/POList.tsx
  └── src/features/inventory/components/InventoryAdjustmentsTab.tsx
       │
       ▼
Application Hooks:
  ├── src/application/crm/useCustomers.ts (Loại bỏ data.slice, đồng bộ PaginatedResult)
  ├── src/application/procurement/usePurchaseOrders.ts (Thêm page, pageSize)
  └── src/application/inventory/useInventoryAdjustments.ts (Thêm page, pageSize)
       │
       ▼
API Layer:
  ├── src/api/customers.api.ts: Thêm fetchCustomersPaginated(filters, page, pageSize)
  ├── src/api/purchase-orders.api.ts: Thêm fetchPurchaseOrdersPaginated(filters, page, pageSize)
  └── src/api/inventory.api.ts: Thêm fetchInventoryAdjustmentsPaginated(filters, page, pageSize)
       │
       ▼
Database:
  - Supabase PostgreSQL: Tận dụng cơ chế LIMIT/OFFSET qua .range(from, to).
  - Không sửa đổi schema hay table constraint.
```

---

## 3. Rủi ro & Đánh giá An toàn ERP (ERP Safety Assessment)

- [x] **Có thay đổi logic kế toán / công nợ không?**: `KHÔNG`
- [x] **Có thay đổi cách tính tồn kho vải / sợi không?**: `KHÔNG`
- [x] **Có thay đổi định mức dệt / nhuộm không?**: `KHÔNG`
- [x] **Có nguy cơ deadlock hoặc vi phạm RLS Multi-Tenant không?**: `KHÔNG` (vẫn tuân thủ RLS tenant_id và vai trò phân quyền).
