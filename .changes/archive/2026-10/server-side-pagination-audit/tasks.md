# Implementation Tasks: Rà soát & Chuyển đổi Server-Side Pagination

Checklist công việc tuần tự tuân thủ nghiêm ngặt các Cổng phê duyệt tại [AI_WORKFLOW.md](file:///d:/VinhPhatERP_v3/AI_WORKFLOW.md) và Skill [`bigdata-perf`](file:///d:/VinhPhatERP_v3/.agents/skills/bigdata-perf/SKILL.md).

---

## 🛑 GATE 1: KHỞI TẠO & PHÊ DUYỆT BẢN KẾ HOẠCH

- [x] Rà soát toàn bộ 57 API files và các List views trong `src/features/`.
- [x] Hoàn thiện `proposal.md` và `delta-spec.md`.
- [ ] Người dùng nhập token duyệt: `APPROVE PHASE 2`.

---

## 📦 PHASE 2: CORE / DATA / API LAYER

_(Triển khai các hàm API và Hook phân trang, không sửa UI layout)_

- [x] Task 2.1: Triển khai `fetchCustomersPaginated` trong [src/api/customers.api.ts](file:///d:/VinhPhatERP_v3/src/api/customers.api.ts) sử dụng `.range()` và `count: 'exact'`.
- [x] Task 2.2: Cập nhật `useCustomerList` trong [src/application/crm/useCustomers.ts](file:///d:/VinhPhatERP_v3/src/application/crm/useCustomers.ts) loại bỏ hoàn toàn `data.slice()`.
- [x] Task 2.3: Triển khai `fetchPurchaseOrdersPaginated` trong [src/api/purchase-orders.api.ts](file:///d:/VinhPhatERP_v3/src/api/purchase-orders.api.ts).
- [x] Task 2.4: Triển khai `fetchInventoryAdjustmentsPaginated` trong [src/api/inventory.api.ts](file:///d:/VinhPhatERP_v3/src/api/inventory.api.ts).
- [x] Task 2.5: Viết/Cập nhật Unit Test Vitest kiểm thử logic phân trang (100% pass: `src/api/__tests__/server-pagination.test.ts`).
- [ ] 🛑 **GATE 2 CHECKPOINT**: Người dùng nhập token duyệt: `APPROVE PHASE 3`.

---

## 🎨 PHASE 3: UI / UX INTEGRATION

_(Kết nối UI DataTable với Server Pagination)_

- [x] Task 3.1: Kết nối `CustomerList.tsx` với API phân trang mới, reset trang 1 khi lọc/tìm kiếm.
- [x] Task 3.2: Kết nối `POListTable.tsx` / `PurchaseOrdersPage.tsx` với pagination props của DataTable.
- [x] Task 3.3: Kết nối `InventoryAdjustmentHistory.tsx` với pagination props của DataTable.
- [x] Task 3.4: Kiểm tra Render Safety (Skeleton loading, Empty state, Null guard).
- [ ] 🛑 **GATE 3 CHECKPOINT**: Người dùng nhập token duyệt: `APPROVE PHASE 4 & 5`.

---

## 🧹 PHASE 4: CLEANUP & CODE POLISH

- [x] Task 4.1: Kiểm tra lại các file đã sửa, xóa console.log debug và mã thừa.
- [x] Task 4.2: Đảm bảo tuân thủ Design Tokens và Architecture Guard.
- [ ] 🛑 **GATE 4 CHECKPOINT**: Người dùng nhập token duyệt: `APPROVE MERGE`.

---

## 🧪 PHASE 5: KIỂM THỬ TOÀN DIỆN & EVIDENCE GATE

Tuân thủ **Evidence Rule §1.2** (Ghi nhận kết quả thực tế của lệnh chạy):

- [x] `npm run rpc:check` (101 RPC calls in sync, 240 functions in DB)
- [x] `npm run typecheck` (0 errors)
- [x] `npm run typecheck:server` (0 errors)
- [x] `npm run lint -- --max-warnings=0` (0 errors, 0 warnings)
- [x] `npm run lint:css` (0 errors)
- [x] `npm run test` (172/172 files passed, 1073/1073 tests passed)
- [x] Di chuyển `.changes/active/server-side-pagination-audit/` vào `.changes/archive/`.
