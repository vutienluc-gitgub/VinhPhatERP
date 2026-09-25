# Implementation Tasks: Ma Trận Bảng Kê Cây Vải Khổ A5 (A5 Packing Matrix)

Checklist công việc tuần tự tuân thủ nghiêm ngặt các Cổng phê duyệt tại [AI_WORKFLOW.md](file:///d:/VinhPhatERP_v3/AI_WORKFLOW.md) và tiêu chuẩn thiết kế [erp-uiux-pro](file:///d:/VinhPhatERP_v3/.agents/skills/erp-uiux-pro/SKILL.md).

---

## 🛑 GATE 1: KHỞI TẠO & PHÊ DUYỆT BẢN KẾ HOẠCH

- [x] Hoàn thiện `proposal.md` theo chuẩn `erp-uiux-pro` (Đã hoàn tất).
- [x] Người dùng nhập token duyệt: `APPROVE PHASE 2` (Đã phê duyệt).

---

## 📦 PHASE 2: CORE / DATA / DOMAIN LOGIC

_(Nghiêm cấm chạm vào UI, CSS hoặc chỉnh sửa layout)_

- [x] Task 2.1: Bổ sung TypeScript types cho ma trận đóng gói (`PackingMatrixRow`, `PackingMatrixCell`, `PackingMatrixGroup`) trong `src/domain/inventory/packing-list.types.ts`.
- [x] Task 2.2: Triển khai domain helpers thuần túy (`buildPackingMatrixRows`, `buildPackingMatrixGroups`) trong `src/domain/inventory/packing-list.utils.ts`.
- [x] Task 2.3: Viết Unit Test Vitest cho domain logic trong `src/domain/inventory/__tests__/packing-matrix.utils.test.ts` (100% tests pass: 23/23 tests passed).
- [x] 🛑 **GATE 2 CHECKPOINT**: Người dùng nhập token duyệt: `APPROVE PHASE 3` (Đã phê duyệt).

---

## 🎨 PHASE 3: UI / UX PRESENTATION (Theo chuẩn `erp-uiux-pro`)

_(Nghiêm cấm can thiệp hoặc thay đổi business logic)_

- [x] Task 3.1: Hoàn thiện Component dùng chung `FabricRollMatrixTable.tsx` tại `src/shared/components/fabric-roll/`:
  - 10 cột STT cây (`01` đến `10`) + 1 cột STT hàng + 1 cột Tổng cộng (kg).
  - Căn lề số liệu: Căn phải + `font-mono tabular-nums`.
  - Hỗ trợ tooltip khi rê chuột vào ô cây vải (hiển thị mã cuộn, số mét, Grade).
  - Hỗ trợ tương tác toggle tích chọn kiểm đếm (`onToggleCheck`).
  - Hỗ trợ điều hướng bàn phím trợ năng (phím `Enter`/`Space` kích hoạt kiểm đếm + `focus-visible:ring-1`).
  - Empty state có Icon SVG thân thiện (`PackageOpen`).
- [x] Task 3.2: Tích hợp chế độ xem ma trận (Matrix View Toggle) vào `FabricRollPackingTable.tsx` (Quản trị kho).
- [x] Task 3.3: Tích hợp chế độ xem ma trận vào Cổng khách hàng `PortalOrderPackingList.tsx`.
- [x] Task 3.4: Tối ưu bản in A5 Landscape trong `FabricPackingPrintTemplate.tsx` (Vừa khít 100 cây / trang A5).
- [x] Task 3.5: Áp dụng Semantic Design Tokens (`bg-surface`, `bg-surface-secondary`, `bg-success-soft`, `text-success`...).
- [x] Task 3.6: Bổ sung trạng thái: Loading Skeleton, Empty State khi chưa có cây vải, Error state.
- [x] 🛑 **GATE 3 CHECKPOINT**: Người dùng nhập token duyệt: `APPROVE PHASE 4 & 5` (Đã phê duyệt).

---

## 🧹 PHASE 4: CLEANUP & CODE POLISH

- [x] Task 4.1: Kiểm tra Architecture Guard: 0 emoji, 0 hardcoded colors trong toàn bộ các file mới. Thay thế import `lucide-react` trực tiếp bằng `<Icon />` chuẩn hệ thống.
- [x] Task 4.2: Loại bỏ mã lặp, kiểm tra phím tắt Tab / Enter điều hướng mượt mà và kiểm tra 0 console.log.
- [x] 🛑 **GATE 4 CHECKPOINT**: Người dùng nhập token duyệt: `APPROVE MERGE` (Đã phê duyệt chính thức).

---

## 🧪 PHASE 5: KIỂM THỬ TOÀN DIỆN & NGHIỆM THU

Tuân thủ **Evidence Rule §1.2** (Ghi lại kết quả thực tế của lệnh chạy):

- [x] `npm run rpc:check`: PASS (Found 101 rpc() call(s), Found 236 function(s) in public schema. All RPC functions in sync).
- [x] `npm run typecheck`: PASS (0 errors, frontend & server clean).
- [x] `npm run lint -- --max-warnings=0`: PASS (0 errors, 0 warnings trên toàn bộ codebase).
- [x] `npm run lint:css`: PASS (0 stylelint errors).
- [x] `npm run test`: PASS (846 passed across 135 test files, 100% pass).
- [x] Đồng bộ tài liệu và di chuyển `.changes/active/a5-packing-matrix` vào `.changes/archive/2026-09/a5-packing-matrix/` (Hoàn tất).
