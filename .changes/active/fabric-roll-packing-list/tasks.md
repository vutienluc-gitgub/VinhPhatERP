# Implementation Tasks: Bảng kê danh sách cây vải (Fabric Roll Packing List)

- **Slug:** `fabric-roll-packing-list`
- **Tài liệu hướng dẫn:** [AI_WORKFLOW.md](file:///d:/VinhPhatERP_v3/AI_WORKFLOW.md) & [spec-driven-workflow.md](file:///d:/VinhPhatERP_v3/.agents/workflows/spec-driven-workflow.md)

---

## 🛑 GATE 1: KHỞI TẠO & PHÊ DUYỆT BẢN KẾ HOẠCH

- [x] Khảo sát hiện trạng code & living spec `specs/inventory/spec.md`.
- [x] Soạn thảo `proposal.md` với Impact Map và đánh giá ERP Safety.
- [x] Soạn thảo `delta-spec.md` với các đặc tả REQ-PL-01 đến REQ-PL-04.
- [x] Phân rã checklist công việc chi tiết trong `tasks.md`.
- [ ] 🛑 **CHỐT CHẶN GATE 1**: Người dùng nhập token duyệt chính xác: `APPROVE PHASE 2`.

---

## 📦 PHASE 2: CORE / DATA / DOMAIN LOGIC

_(Tuyệt đối không chạm vào UI, CSS hoặc chỉnh sửa layout)_

- [x] **Task 2.1**: Định nghĩa cấu trúc dữ liệu và TypeScript Types:
  - Tạo `src/domain/inventory/packing-list.types.ts`: `FabricRollPackingItem`, `PackingGroupSummary`, `PackingListTotal`, `RollCheckoffState`.
- [x] **Task 2.2**: Xây dựng Pure Domain Utilities trong `src/domain/inventory/packing-list.utils.ts`, `packing-checkoff.utils.ts`, `packing-export.utils.ts`:
  - `calculatePackingSummary`: Tính tổng cây, tổng kg, cân nặng trung bình, tỷ lệ Grade A/B.
  - `groupRollsByColorAndBatch`: Tự động phân tách cây vải theo màu và số lô.
  - `processRollCheckoff`: Xử lý logic quét mã barcode/QR kiểm đếm tại hiện trường (phát hiện quét trùng, quét sai).
  - `exportPackingListToCsvContent`: Chuẩn hóa định dạng xuất dữ liệu bảng kê cho Excel (hỗ trợ tiếng Việt UTF-8 BOM).
- [x] **Task 2.3**: Viết bộ Unit Test tự động (Vitest):
  - Tạo `src/domain/inventory/__tests__/packing-list.utils.test.ts`: 16 bài test kiểm thử toán tử tổng hợp, làm tròn kg, gom nhóm màu, và xử lý quét mã (Pass 100%).
- [ ] 🛑 **GATE 2 CHECKPOINT**: Đảm bảo 100% test pass -> Chờ token duyệt: `APPROVE PHASE 3`.

---

## 🎨 PHASE 3: UI / UX PRESENTATION

_(Sử dụng Semantic Design Tokens, không viết business logic trong UI)_

- [x] **Task 3.1**: Xây dựng Hook quản lý trạng thái:
  - Tạo `src/features/finished-fabric/hooks/useFabricPackingList.ts` (quản lý bộ lọc màu, chế độ xem Table/Grid, danh sách cây đã quét kiểm đếm, xuất CSV).
- [x] **Task 3.2**: Xây dựng Component hiển thị cốt lõi:
  - Tạo `src/features/finished-fabric/components/FabricRollMatrixGrid.tsx` (Lưới ô cây vải 2-4 cột tối ưu mobile, badge phẩm cấp Grade A/B).
  - Tạo `src/features/finished-fabric/components/FabricPackingCheckoffBar.tsx` (Thanh tiến độ kiểm đếm Barcode/QR với tỷ lệ % và số kg đã quét).
  - Tạo `src/features/finished-fabric/components/FabricPackingStatsCards.tsx` (Thẻ thống kê tổng số cây, tổng kg, cân nặng TB, phẩm cấp).
  - Tạo `src/features/finished-fabric/components/FabricRollTableView.tsx` (Bảng dữ liệu chi tiết cho Desktop).
  - Tạo `src/features/finished-fabric/components/FabricRollPackingTable.tsx` (Component chuyển đổi linh hoạt Table <-> Matrix Grid).
- [x] **Task 3.3**: Tích hợp Modal tra cứu & In ấn:
  - Tạo `src/features/finished-fabric/components/FabricRollPackingListModal.tsx` cho phép mở bảng kê từ danh sách cuộn vải hoặc phiếu xuất hàng.
  - Tạo mẫu in A4 chuẩn hóa `src/features/finished-fabric/components/FabricPackingPrintTemplate.tsx`.
- [x] **Task 3.4**: Đảm bảo Render Safety:
  - Empty state khi phiếu chưa có cây vải nào.
  - Stable key (`key={roll.id || roll.roll_code}`).
  - Kiểm thử giao diện và hook tự động với Vitest (9 tests PASS 100%).
- [ ] 🛑 **GATE 3 CHECKPOINT**: Chờ token duyệt: `APPROVE PHASE 4 & 5`.

---

## 🧹 PHASE 4: CLEANUP & CODE POLISH

- [ ] **Task 4.1**: Trích xuất toàn bộ nhãn, thông báo, tiêu đề tiếng Việt vào `src/features/finished-fabric/packing-list.constants.ts`.
- [ ] **Task 4.2**: Xóa mọi `console.log` debug, kiểm tra không còn kiểu `any`.
- [ ] **Task 4.3**: Kiểm tra tuân thủ **Rule 11 Ratchet (< 300 dòng/file)** trên toàn bộ file mới tạo.

---

## 🧪 PHASE 5: KIỂM THỬ TOÀN DIỆN & NGHIỆM THU

_(Áp dụng nghiêm ngặt **Evidence Rule §1.2** — ghi nhận kết quả thực tế)_:

- [ ] `npm run rpc:check`: [Ghi kết quả thực tế]
- [ ] `npm run typecheck`: [Ghi kết quả thực tế]
- [ ] `npm run lint -- --max-warnings=0`: [Ghi kết quả thực tế]
- [ ] `npm run lint:css`: [Ghi kết quả thực tế]
- [ ] `npm run test`: [Ghi kết quả thực tế]
- [ ] 🛑 **GATE 4 CHECKPOINT**: Chờ token duyệt: `APPROVE MERGE`.
