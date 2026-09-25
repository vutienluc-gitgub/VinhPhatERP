# Đề xuất Thay đổi (Change Proposal): Bảng kê Cây vải Ma trận 10 cây/dòng chuẩn Giấy A5 Ngang (A5 Packing Matrix)

- **Slug:** `a5-packing-matrix`
- **Author:** Antigravity Resident Agent
- **Trạng thái:** COMPLETED
- **Domain:** inventory / finished-fabric / customer-portal

---

## 1. Bối cảnh & Lý do thay đổi (Context & Why)

### Vấn đề hiện tại:

- Khi đơn hàng có từ **20 đến 100 cây vải trở lên**:
  - Giao diện Customer Portal (`PortalOrderPackingList.tsx`) chia 2 cột dọc khiến trang đơn hàng bị kéo dài 50 dòng, che khuất các phần thanh toán và tiến độ.
  - Trên phiếu in xuất xưởng (`FabricPackingPrintTemplate.tsx`), mỗi cây vải chiếm 1 dòng dọc, làm bảng kê tràn ra 3–5 trang giấy.
  - Trong thực tế sản xuất tại **Công ty Dệt May Vĩnh Phát**, xưởng sử dụng **giấy in kim/laser A5 4 liên nằm ngang (210mm x 148mm)**. Chiều cao khả dụng cho phần bảng chỉ khoảng 70mm–80mm (tối đa 12–14 dòng). Cách dàn trang dọc hoàn toàn không in vừa trên 1 liên A5.

### Hành vi mong đợi sau khi hoàn thành:

1. **Chuẩn hóa Ma trận 10 cây/dòng (Decade Weight Matrix)**:
   - 10 cây trải đều trên 10 cột ngang, có cột STT dòng (`01 - 10`, `11 - 20`...) và cột **Cộng dòng (Subtotal kg)**.
   - 100 cây chỉ tốn **10 dòng**, vừa khít chiều cao khả dụng của giấy A5 ngang.
2. **Thiết kế 1 lần - Tái sử dụng mọi nơi (Universal Reusability)**:
   - Component dùng chung tại `@/shared/components/fabric-roll/FabricRollMatrixTable.tsx` (tránh vi phạm kiến trúc `no-cross-feature-import`).
   - Sử dụng chung cho:
     - Mẫu in phiếu giao nhận A5 ngang 4 liên (`FabricPackingPrintTemplate.tsx`).
     - Cổng thông tin khách hàng (`PortalOrderPackingList.tsx`).
     - Bảng kê kho thành phẩm nội bộ (`FabricRollPackingTable.tsx`).
3. **In ấn A5 Landscape hoàn hảo**:
   - Cấu hình `@page { size: A5 landscape; margin: 6mm 8mm; }`, chừa lề đục lỗ liên, font chữ tinh chỉnh 9pt–10pt sắc nét.

---

## 2. Bản đồ Tác động (Impact Map)

```text
UI (Shared):   src/shared/components/fabric-roll/FabricRollMatrixTable.tsx
UI (Portal):   src/features/customer-portal/orders/PortalOrderPackingList.tsx
UI (ERP Kho):  src/features/finished-fabric/components/FabricRollPackingTable.tsx
UI (Print):    src/features/finished-fabric/components/FabricPackingPrintTemplate.tsx
  │
  ▼
Hook:          src/features/finished-fabric/hooks/useFabricPackingList.ts
  │
  ▼
Domain Logic:  src/domain/inventory/packing-matrix.utils.ts (hoặc packing-list.utils.ts)
               src/domain/inventory/packing-list.types.ts
  │
  ▼
Unit Test:     src/domain/inventory/__tests__/packing-matrix.utils.test.ts
               src/shared/components/fabric-roll/__tests__/FabricRollMatrixTable.test.tsx
  │
  ▼
Database:      Không thay đổi Schema / DB (Thuần Client Presentation & Domain Pure Calculation)
```

---

## 3. Rủi ro & Đánh giá An toàn ERP (ERP Safety Assessment)

- [ ] **Có thay đổi logic kế toán / công nợ không?**: `KHÔNG`
- [ ] **Có thay đổi cách tính tồn kho vải / sợi không?**: `KHÔNG`
- [ ] **Có thay đổi định mức dệt / nhuộm không?**: `KHÔNG`
- [ ] **Có nguy cơ deadlock hoặc vi phạm RLS Multi-Tenant không?**: `KHÔNG`

_Cam kết: Nghiệp vụ số liệu (tổng kg, cân nặng từng cây) được bảo toàn 100%, chỉ tái cấu trúc cách gom nhóm hiển thị ma trận và dàn trang in ấn A5 ngang._
