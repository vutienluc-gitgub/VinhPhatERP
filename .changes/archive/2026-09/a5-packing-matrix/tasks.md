# Implementation Tasks: Bảng kê Cây vải Ma trận 10 cây/dòng chuẩn Giấy A5 Ngang (A5 Packing Matrix)

- **Slug:** `a5-packing-matrix`
- **Checklist tuân thủ nghiêm ngặt các Cổng phê duyệt tại [AI_WORKFLOW.md](file:///d:/VinhPhatERP_v3/AI_WORKFLOW.md)**.

---

## 🛑 GATE 1: KHỞI TẠO & PHÊ DUYỆT BẢN KẾ HOẠCH

- [x] Hoàn thiện `proposal.md` và `delta-spec.md`.
- [ ] Người dùng duyệt Gate 1 bằng token chính xác: `APPROVE PHASE 2`.

---

## 📦 PHASE 2: CORE / DATA / DOMAIN LOGIC

_(Nghiêm cấm chạm vào UI, CSS hoặc chỉnh sửa layout)_

- [x] Task 2.1: Bổ sung kiểu dữ liệu ma trận `PackingMatrixRow`, `PackingMatrixCell` trong `src/domain/inventory/packing-list.types.ts`.
- [x] Task 2.2: Triển khai hàm nghiệp vụ `buildPackingMatrixRows` (chia khối 10 cây, tính subtotal kg, xử lý dòng cuối lẻ cây) trong `src/domain/inventory/packing-list.utils.ts`.
- [x] Task 2.3: Viết Unit Test Vitest (`src/domain/inventory/__tests__/packing-matrix.utils.test.ts`) kiểm thử toàn bộ trường hợp biên (0 cây, 3 cây, 10 cây, 43 cây, 100 cây, số thập phân kg).
- [x] Chạy `npm run test` đảm bảo 100% test pass (23/23 tests passed, `npm run typecheck` passed 0 errors).
- [ ] 🛑 **GATE 2 CHECKPOINT**: Dừng lại chờ người dùng nhập token duyệt: `APPROVE PHASE 3`.

---

## 🎨 PHASE 3: UI / UX PRESENTATION & UNIVERSAL REUSABILITY

_(Nghiêm cấm can thiệp hoặc thay đổi business logic)_

- [x] Task 3.1: Xây dựng Component dùng chung `src/shared/components/fabric-roll/FabricRollMatrixTable.tsx` (hỗ trợ chế độ Web tương tác, Mobile cuộn ngang, và In ấn A5).
- [x] Task 3.2: Tích hợp vào Mẫu in A5 ngang 4 liên `src/features/finished-fabric/components/FabricPackingPrintTemplate.tsx` với CSS `@page { size: A5 landscape; }` và bố cục 4 chữ ký.
- [x] Task 3.3: Tích hợp vào Customer Portal `src/features/customer-portal/orders/PortalOrderPackingList.tsx` thay thế hiển thị 2 cột dài bằng ma trận 10 cây kèm thẻ tóm tắt.
- [x] Task 3.4: Bổ sung tùy chọn xem Ma trận A5 trong Bảng kê ERP Kho `src/features/finished-fabric/components/FabricRollPackingTable.tsx`.
- [x] Task 3.5: Viết component test cho `FabricRollMatrixTable` và kiểm tra Render Safety (null guards, stable keys) - 42/42 related tests passed.
- [x] 🛑 **GATE 3 CHECKPOINT**: Người dùng duyệt với token: `APPROVE PHASE 4 & 5`.

---

## 🧹 PHASE 4: CLEANUP & CODE POLISH

- [x] Task 4.1: Đảm bảo toàn bộ văn bản Tiếng Việt đưa vào constants (`PACKING_LIST_TEXT`, `PORTAL_ORDER_DETAIL_TEXT`).
- [x] Task 4.2: Kiểm tra Design Tokens (không hardcode màu tĩnh trong `.css`, đạt chuẩn `no-hardcoded-colors`).
- [x] Task 4.3: Xóa debug log, kiểm tra import chuẩn (không cross-feature relative import, export qua `@/shared/components`).
- [x] 🛑 **GATE 4 CHECKPOINT**: Người dùng duyệt với token: `APPROVE MERGE`.

---

## 🧪 PHASE 5: KIỂM THỬ TOÀN DIỆN & NGHIỆM THU

Tuân thủ **Evidence Rule §1.2** (Ghi lại kết quả thực tế của lệnh chạy):

- [x] `npm run rpc:check`: PASSED (Exit code 0, 101 rpc() calls in sync with 236 DB functions).
- [x] `npm run typecheck`: PASSED (Exit code 0, 0 TypeScript errors).
- [x] `npm run lint -- --max-warnings=0`: PASSED (Exit code 0, 0 errors, 0 warnings).
- [x] `npm run lint:css`: PASSED (Exit code 0, 0 CSS/stylelint errors).
- [x] `npm run test`: PASSED (Exit code 0, 135/135 test files passed, 845/845 tests passed 100%).
- [x] Đồng bộ `delta-spec.md` vào `specs/inventory/spec.md`: Đã bổ sung `REQ-INV-05`.
- [x] Lưu trữ Change (Archive) vào `.changes/archive/2026-09/a5-packing-matrix`.
