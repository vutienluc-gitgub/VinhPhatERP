# Đề xuất Thay đổi (Change Proposal): Bảng kê danh sách cây vải (Fabric Roll Packing List)

- **Slug:** `fabric-roll-packing-list`
- **Author:** AI Resident Engineer & Tech Lead
- **Trạng thái:** PENDING GATE 1
- **Domain:** `inventory` (kết nối `shipments` & `orders`)

---

## 1. Bối cảnh & Lý do thay đổi (Context & Why)

### 1.1 Vấn đề hiện tại

- Trong ngành dệt may Vĩnh Phát, mọi giao dịch xuất nhập vải đều dựa trên **từng cây vải thực tế (Roll-level)** chứ không thể ước lượng theo số mét hay số kg trung bình.
- Khách hàng (các xưởng may, hãng thời trang) và tài xế giao nhận luôn yêu cầu **Bảng kê danh sách cây vải (Packing List)** đi kèm phiếu xuất kho để kiểm đếm từng cuộn khi dỡ hàng xuống xe.
- Hiện tại, tính năng bảng kê mới chỉ có bản hiển thị xem nhanh trên Customer Portal, trong khi hệ thống ERP Nội bộ (Kho Thành Phẩm & Logistics) còn phân tán, chưa có:
  1. Module Bảng kê danh sách cây vải tập trung, hỗ trợ cả 2 chế độ: **Bảng dữ liệu chi tiết (Table)** và **Lưới ma trận cuộn (Compact Matrix Grid)**.
  2. Bảng tổng hợp số liệu chuẩn: Tổng số cây, Tổng cân nặng tịnh (Net kg), Cân nặng bình quân, Tỷ lệ cây Grade A / Grade B.
  3. Khả năng in ấn bảng kê xuất xưởng khổ A4/A5 và xuất file Excel đối soát cho khách hàng.
  4. Hỗ trợ quét Barcode/QR Code để kiểm đếm cây khi xuất/nhập kho.

### 1.2 Hành vi mong đợi sau khi hoàn thành

- Cung cấp component chuẩn hóa `FabricRollPackingList` và hook `useFabricPackingList` dùng chung cho toàn bộ phân hệ Kho vải thành phẩm (`finished-fabric`) và Xuất kho giao hàng (`shipments`).
- Tự động gom nhóm theo Mặt hàng, Màu sắc, Số lô (Batch).
- Tích hợp nút in nhanh Bảng kê A4/A5 và nút xuất file Excel đạt chuẩn chứng từ dệt may.

---

## 2. Bản đồ Tác động (Impact Map)

Tuân thủ nghiêm ngặt quy chuẩn kiến trúc và luồng dữ liệu tại [AI_WORKFLOW.md](file:///d:/VinhPhatERP_v3/AI_WORKFLOW.md):

```text
UI Layer:
  ├── src/shared/components/fabric/FabricRollPackingTable.tsx (Bảng kê cây vải đa năng)
  ├── src/features/finished-fabric/components/FabricRollPackingListModal.tsx (Modal tra cứu & in ấn)
  └── src/features/shipments/components/ShipmentPackingListTab.tsx (Tab bảng kê trong phiếu xuất)
        │
        ▼
Hook Layer:
  └── src/features/finished-fabric/hooks/useFabricPackingList.ts (Quản lý state, filter, scan, group)
        │
        ▼
Domain / Utilities Layer (Pure Logic, 100% Unit Test):
  ├── src/domain/inventory/packing-list.utils.ts (Tính tổng kg, bình quân, nhóm theo màu, format cây)
  └── src/domain/inventory/types.ts (Định nghĩa kiểu dữ liệu PackingListSummary, RollItem)
        │
        ▼
API / RPC Layer:
  └── Supabase client truy vấn có type-safe từ bảng finished_fabric_rolls & shipment_items
        │
        ▼
Database:
  └── Bảng finished_fabric_rolls, shipment_items (Read-only / Idempotent status update qua RPC)
```

---

## 3. Rủi ro & Đánh giá An toàn ERP (ERP Safety Assessment)

- [x] **Có thay đổi logic kế toán / công nợ không?**: `KHÔNG` (Số tiền hàng vẫn căn cứ theo tổng kg thực tế \* đơn giá đã định nghĩa).
- [x] **Có thay đổi cách tính tồn kho vải / sợi không?**: `KHÔNG` (Không can thiệp vào thuật toán khấu trừ tồn kho; trạng thái `in_stock`, `reserved`, `shipped` giữ nguyên).
- [x] **Có thay đổi định mức dệt / nhuộm không?**: `KHÔNG`.
- [x] **Có nguy cơ deadlock hoặc vi phạm RLS Multi-Tenant không?**: `KHÔNG` (Mọi truy vấn đều lọc qua `tenant_id` và tuân thủ RLS fail-closed).

---

## 4. Kế hoạch Tuân thủ Quy chuẩn (Architecture Guard)

1. **Rule 11 (File Size Ratchet)**: Mọi file mới tạo hoặc chỉnh sửa đều PHẢI `< 300` dòng mã (`npm run size:check`).
2. **ESLint & Stylelint Guard**: Cấm emoji trong code, cấm hardcoded colors (dùng Semantic Design Tokens: `text-foreground`, `bg-surface`, `border-border`), cấm thẻ `<select>` native.
3. **Evidence Rule §1.2**: Mọi bước nghiệm thu đều chạy lệnh thực tế và ghi nhận output thật.
