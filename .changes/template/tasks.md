# Implementation Tasks: [Tên tính năng hoặc mã Task]

Checklist công việc tuần tự tuân thủ nghiêm ngặt các Cổng phê duyệt tại [AI_WORKFLOW.md](file:///d:/VinhPhatERP_v3/AI_WORKFLOW.md).

---

## 🛑 GATE 1: KHỞI TẠO & PHÊ DUYỆT BẢN KẾ HOẠCH

- [ ] Hoàn thiện `proposal.md` và `delta-spec.md` (nếu có).
- [ ] Người dùng nhập token duyệt: `APPROVE PHASE 2`.

---

## 📦 PHASE 2: CORE / DATA / DOMAIN LOGIC

_(Nghiêm cấm chạm vào UI, CSS hoặc chỉnh sửa layout)_

- [ ] Task 2.1: Viết/Cập nhật Zod validation schema.
- [ ] Task 2.2: Triển khai Service / Helper xử lý dữ liệu (sử dụng `safeUpsert`, atomic RPC).
- [ ] Task 2.3: Viết Unit Test (Vitest) cho domain logic (Đạt 100% test pass).
- [ ] 🛑 **GATE 2 CHECKPOINT**: Người dùng nhập token duyệt: `APPROVE PHASE 3`.

---

## 🎨 PHASE 3: UI / UX PRESENTATION

_(Nghiêm cấm can thiệp hoặc thay đổi business logic)_

- [ ] Task 3.1: Dựng giao diện / kết nối Hook với Form/Table.
- [ ] Task 3.2: Áp dụng Semantic Design Tokens (`text-foreground`, `bg-surface-secondary`...).
- [ ] Task 3.3: Bổ sung đầy đủ 4 trạng thái bắt buộc: Loading Skeleton, Error State, Empty State, Pending Submit.
- [ ] Task 3.4: Render Safety: Null guards (`??`), stable keys (cấm dùng index).
- [ ] 🛑 **GATE 3 CHECKPOINT**: Người dùng nhập token duyệt: `APPROVE PHASE 4 & 5`.

---

## 🧹 PHASE 4: CLEANUP & CODE POLISH

- [ ] Task 4.1: Loại bỏ mã lặp, trích xuất hằng số tiếng Việt vào constants.
- [ ] Task 4.2: Xóa code thừa, console.log debug.
- [ ] 🛑 **GATE 4 CHECKPOINT**: Người dùng nhập token duyệt: `APPROVE MERGE`.

---

## 🧪 PHASE 5: KIỂM THỬ TOÀN DIỆN & NGHIỆM THU

Tuân thủ **Evidence Rule §1.2** (Ghi lại kết quả thực tế của lệnh chạy):

- [ ] `npm run rpc:check`: [Ghi kết quả thực tế]
- [ ] `npm run typecheck`: [Ghi kết quả thực tế]
- [ ] `npm run lint -- --max-warnings=0`: [Ghi kết quả thực tế]
- [ ] `npm run lint:css`: [Ghi kết quả thực tế]
- [ ] `npm run test`: [Ghi kết quả thực tế]
- [ ] Đồng bộ `delta-spec.md` vào `specs/` (nếu có) và di chuyển vào `.changes/archive/`.
