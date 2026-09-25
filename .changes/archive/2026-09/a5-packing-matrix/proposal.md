# Đề xuất Thay đổi: Ma Trận Bảng Kê Cây Vải Khổ A5 (A5 Packing Matrix)

- **Slug:** `a5-packing-matrix`
- **Author:** AI Resident Agent & Tech Lead
- **Trạng thái:** PENDING GATE 1
- **Domain:** `inventory`
- **Design Intelligence Standard:** `erp-uiux-pro` (High-Density B2B: Density 9/10, Variance 2/10, Motion 2/10)

---

## 1. Bối cảnh & Lý do thay đổi (Context & Why)

### Vấn đề hiện tại:

1. **Dạng xem đơn điệu & chiếm diện tích**: Giao diện bảng kê cây vải (`FabricRollPackingTable.tsx`) trước đây hiển thị toàn bộ cây vải theo danh sách dọc 1 chiều (1 hàng/cây). Khi đơn hàng có 50 - 100 cây vải, danh sách kéo dài từ 3 đến 5 trang màn hình, gây khó khăn cho thủ kho và khách hàng khi đối soát nhanh.
2. **Khổ in thực tế tại xưởng & xe tải là A5 Landscape**: Phiếu giao hàng và bảng kê cây vải thực tế của Dệt May Vĩnh Phát kẹp theo hàng hóa thường được in trên giấy **A5 nằm ngang (A5 Landscape)** để tiết kiệm giấy và nhỏ gọn cho tài xế/thủ kho ký nhận. Dạng bảng dọc bị tràn trang (2-3 tờ A5 rời rạc, dễ thất lạc).
3. **Thiếu công thái học kiểm đếm (Ergonomics)**: Công nhân bốc dỡ hàng cần nhìn theo từng lốc 10 cây (01-10, 11-20...) và biết ngay tổng khối lượng của từng lốc 10 cây để kiểm tra cân bàn cân pallet.

### Giải pháp & Hành vi kỳ vọng:

1. **Thành phần Ma trận cây vải dùng chung (`FabricRollMatrixTable`)**: Xây dựng dạng bảng lưới ma trận 10 cột chuẩn công nghiệp (STT 01 - 10), mỗi ô hiển thị cân nặng tịnh (kg) của cây vải, cuối mỗi hàng có cột **CỘNG (KG)** cho lốc 10 cây đó.
2. **Tối ưu in ấn A5 Landscape (`FabricPackingPrintTemplate`)**: 100 cây vải được nén trọn vẹn trong đúng 1 trang A5 nằm ngang với 10 hàng x 10 cột cực kỳ trực quan, kèm chữ ký 4 bên (Người lập, Thủ kho, Tài xế, Khách hàng).
3. **Chuyển đổi linh hoạt đa chế độ xem**: Cung cấp nút chuyển đổi mượt mà giữa dạng **Danh sách chi tiết (Table View)** và **Ma trận cô đọng (Matrix View)** trên cả màn hình Quản trị kho (`FabricRollPackingTable`) và Cổng thông tin khách hàng (`PortalOrderPackingList`).
4. **Kiểm đếm tương tác (Interactive Verification)**: Cho phép click vào từng ô cây vải trên màn hình tablet/mobile để đánh dấu tích xanh đã kiểm đếm (`checked`), tooltip hiển thị đầy đủ mã cuộn, số mét, khổ vải khi rê chuột.

---

## 2. Thiết Kế UI/UX Theo Chuẩn `erp-uiux-pro`

Áp dụng bộ quy chuẩn công thái học B2B từ `.agents/skills/erp-uiux-pro/SKILL.md`:

| Tiêu chuẩn                 | Triển khai trong A5 Packing Matrix                                                                                                                                                                                           |
| :------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Density Dial (9/10)**    | Mật độ hiển thị siêu đậm đặc (High-Density): Padding ô ma trận `py-1 px-1.5` trên desktop và `py-0.5 px-1` khi in A5. Font chữ số 11-12px rõ nét, không chiếm diện tích thừa.                                                |
| **Typography & Numbers**   | Số kg trên mỗi ô căn phải (`text-right`), áp dụng `font-mono tabular-nums` giúp các hàng số thẳng tắp. STT cột (01 - 10) căn giữa (`text-center`).                                                                           |
| **Semantic Design Tokens** | Cấm 100% hardcoded hex. Màu nền ô dùng `bg-surface`, hover dùng `hover:bg-surface-secondary`. Ô đã kiểm đếm dùng `bg-success-soft text-success border-success/40`. Cây Grade B dùng cảnh báo `bg-warning-soft text-warning`. |
| **Accessibility (a11y)**   | 0 Emoji. Icon chuyển đổi chế độ xem dùng Lucide SVG (`LayoutGrid`, `ListFilter`). Nút bấm có `aria-label` và tooltip hỗ trợ người dùng.                                                                                      |
| **Overflow & Responsive**  | Bọc trong container `overflow-x-auto`, bảng không vỡ khi màn hình hẹp (mobile tự động cho phép cuộn ngang hoặc dàn 5 cột).                                                                                                   |

---

## 3. Bản đồ Tác động (Impact Map)

```text
UI Layer:
  ├── src/shared/components/fabric-roll/FabricRollMatrixTable.tsx (Component ma trận tái sử dụng)
  ├── src/features/finished-fabric/components/FabricRollPackingTable.tsx (Tích hợp View Mode Toggle)
  ├── src/features/finished-fabric/components/FabricPackingPrintTemplate.tsx (Hỗ trợ layout in A5 Landscape)
  └── src/features/customer-portal/orders/PortalOrderPackingList.tsx (Hiển thị cho khách hàng xem)
       │
       ▼
Domain / Logic Layer:
  ├── src/domain/inventory/packing-list.types.ts (Định nghĩa PackingMatrixRow, PackingMatrixCell)
  ├── src/domain/inventory/packing-list.utils.ts (Hàm buildPackingMatrixRows, buildPackingMatrixGroups)
  └── src/domain/inventory/__tests__/packing-matrix.utils.test.ts (Unit test Vitest bao phủ 100%)
       │
       ▼
Database / RPC:
  └── Không thay đổi Database Schema / RPC (Tính toán ma trận hoàn toàn thuần túy phía Client Domain)
```

---

## 4. Rủi ro & Đánh giá An toàn ERP (ERP Safety Assessment)

- [x] **Có thay đổi logic kế toán / công nợ không?**: `KHÔNG` (Số tiền vẫn tính theo `total_net_weight * unit_price`).
- [x] **Có thay đổi cách tính tồn kho vải / sợi không?**: `KHÔNG` (Không can thiệp vào trừ kho hay trạng thái kho của cây vải).
- [x] **Có thay đổi định mức dệt / nhuộm không?**: `KHÔNG`.
- [x] **Có nguy cơ deadlock hoặc vi phạm RLS Multi-Tenant không?**: `KHÔNG` (Không thực hiện bất kỳ mutation DB nào).

---

## 5. Kế hoạch Nghiệm thu (Verification Checklist)

Trước khi đóng Gate 4, cam kết hoàn thành bộ kiểm thử chất lượng:

1. `npm run typecheck` — 0 lỗi TypeScript ở cả Frontend.
2. `npm run lint -- --max-warnings=0` — 0 warnings, không có emoji, không có mã màu tĩnh.
3. `npm run lint:css` — 0 Stylelint errors.
4. `npm run test` — Toàn bộ test suite Vitest cho `packing-matrix.utils` pass 100%.
5. Kiểm tra trực quan bản in A5 Landscape đạt chuẩn thẩm mỹ, không tràn trang thứ 2 với đơn hàng 100 cây.
