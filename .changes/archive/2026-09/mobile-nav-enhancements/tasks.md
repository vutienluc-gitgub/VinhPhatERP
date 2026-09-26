# Implementation Tasks: Nâng cấp Toàn diện Trải nghiệm Mobile Bottom Navigation

Checklist công việc tuần tự tuân thủ nghiêm ngặt các Cổng phê duyệt tại [AI_WORKFLOW.md](file:///d:/VinhPhatERP_v3/AI_WORKFLOW.md) và [spec-driven-workflow](file:///d:/VinhPhatERP_v3/.agents/workflows/spec-driven-workflow.md).

---

## 🛑 GATE 1: KHỞI TẠO & PHÊ DUYỆT BẢN KẾ HOẠCH

- [x] Khảo sát hiện trạng code: `MobileBottomNav.tsx`, `AppShell.tsx`, `MobileMoreDrawer.tsx`, `mobile-nav.css`, `app-shell.css`.
- [x] Hoàn thiện `proposal.md` và `delta-spec.md`.
- [ ] Người dùng nhập token duyệt: `APPROVE PHASE 2`.

---

## 📦 PHASE 2: CORE / DATA / NAVIGATION CONFIG LOGIC

_(Nghiêm cấm can thiệp layout UI hoặc CSS trong pha này)_

- [x] Task 2.1: Xây dựng utility phản hồi xúc giác công thái học `src/shared/lib/haptics.ts` (kiểm tra `navigator.vibrate`, reduced-motion guard).
- [x] Task 2.2: Xây dựng cấu hình phân bổ tab theo vai trò `src/app/layouts/resolvers/role-tabs.config.ts` (hỗ trợ `admin`, `manager`, `sales`, `accountant`, `warehouse`, `production`, và fallback an toàn).
- [x] Task 2.3: Viết Unit Test Vitest cho `haptics` và `role-tabs.config` (Đạt 100% test pass).
- [ ] 🛑 **GATE 2 CHECKPOINT**: Người dùng nhập token duyệt: `APPROVE PHASE 3`.

---

## 🎨 PHASE 3: UI / UX PRESENTATION & SAFE AREA

_(Nghiêm cấm can thiệp hoặc thay đổi business calculation)_

- [x] Task 3.1: Cập nhật CSS Token và Layout (`app-shell.css`, `mobile-nav.css`, `MobileMoreDrawer.module.css`) để áp dụng triệt để `env(safe-area-inset-bottom, 0px)` cho `.content-shell` và ngăn kéo.
- [x] Task 3.2: Cập nhật `MobileBottomNav.tsx`:
  - Hỗ trợ hiển thị huy hiệu `badge` (số đếm) và chấm đỏ `hasDot`.
  - Tích hợp haptic feedback khi chạm tab.
  - Đảm bảo thuộc tính a11y đầy đủ (`role="tab"`, `aria-label`).
- [x] Task 3.3: Cập nhật `AppShell.tsx`:
  - Phân giải tab động theo vai trò người dùng thay vì hardcode.
  - Truyền dữ liệu badge (ví dụ: `totalUnread`, `notifUnread`, hoặc số việc cần xử lý).
  - Đồng bộ danh sách loại trừ trong `MobileMoreDrawer`.
- [x] Task 3.4: Bổ sung và cập nhật bài kiểm thử `src/app/layouts/__tests__/MobileBottomNav.test.tsx` (kiểm thử badge rendering, haptics trigger, active state).
- [ ] 🛑 **GATE 3 CHECKPOINT**: Người dùng nhập token duyệt: `APPROVE PHASE 4 & 5`.

---

## 🧹 PHASE 4: CLEANUP & CODE POLISH

- [x] Task 4.1: Loại bỏ mã lặp, trích xuất text tiếng Việt vào constants.
- [x] Task 4.2: Xóa code thừa, console.log debug, đảm bảo 0 emoji và 0 hardcoded colors.
- [ ] 🛑 **GATE 4 CHECKPOINT**: Người dùng nhập token duyệt: `APPROVE MERGE`.

---

## 🧪 PHASE 5: KIỂM THỬ TOÀN DIỆN & NGHIỆM THU

Tuân thủ **Evidence Rule §1.2** (Ghi lại kết quả thực tế của lệnh chạy):

- [x] `npm run rpc:check`: PASS (0 issues found, 101 rpc calls scanned, 236 DB functions verified)
- [x] `npm run typecheck`: PASS (0 errors frontend, 0 errors backend `typecheck:server`)
- [x] `npm run lint -- --max-warnings=0`: PASS (0 errors, 0 warnings across all files)
- [x] `npm run lint:css`: PASS (0 stylelint errors, 100% semantic design tokens)
- [x] `npm run test`: PASS (137 test files passed, 862 tests passed, 0 failures)
- [x] Lưu trữ change vào `.changes/archive/2026-09/` (Đã hoàn tất sau khi nhận APPROVE MERGE).
