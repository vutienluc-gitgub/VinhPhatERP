# VinhPhatERP Living Specifications (Living Specs)

Thư mục `specs/` là **Single Source of Truth (Nguồn chân lý duy nhất)** mô tả hành vi, nghiệp vụ và quy tắc nghiệp vụ của hệ thống ERP Dệt May Vĩnh Phát theo chuẩn **Spec-Driven Development (SDD)**.

---

## 1. Cấu trúc thư mục theo Domain Dệt May

```text
specs/
├── yarn/               # Quản lý nhập sợi, kho sợi, nhà cung cấp sợi, lô sợi
├── raw-fabric/         # Dệt mộc, máy dệt, cuộn vải mộc, tem mộc, ca dệt
├── dyeing/             # Gia công nhuộm, xuất mộc, định mức hao hụt, nghiệm thu thành phẩm
├── inventory/          # Kho vải thành phẩm, kiểm cuộn, barcode, phân loại lỗi A/B/C
├── orders/             # Đơn đặt hàng dệt may, tiến độ chuyền, kế hoạch sản xuất
└── finance/            # Công nợ NCC/KH, phiếu thu chi, đồng bộ MISA ASP (Thông tư 78)
```

---

## 2. Tiêu chuẩn viết Spec (Living Specification Standard)

Mỗi file `spec.md` trong từng domain được viết theo chuẩn **Requirement & Scenarios (RFC 2119 / BDD)**:

- **SHALL / MUST**: Bắt buộc tuân thủ tuyệt đối (vi phạm = bug nghiêm trọng).
- **SHOULD**: Khuyến nghị kiến trúc/UX chuẩn.
- **Scenarios**: `GIVEN` (điều kiện đầu) - `WHEN` (hành động kích hoạt) - `THEN` (kết quả mong đợi).

---

## 3. Quy trình tiến hóa Spec (Spec Evolution)

- Khi có tính năng mới hoặc thay đổi nghiệp vụ: KHÔNG sửa trực tiếp file spec gốc.
- Tạo một đề xuất trong `.changes/active/<task-slug>/delta-spec.md`.
- Sau khi code và kiểm thử vượt qua **Gate 4 (`APPROVE MERGE`)**, delta spec sẽ được merge ngược vào `specs/` tương ứng.
