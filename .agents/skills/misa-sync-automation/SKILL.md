---
name: misa-sync-automation
description: Quy trình tự động hóa bóc tách hóa đơn điện tử XML (Thông tư 78), đồng bộ danh mục Khách hàng, Nhà cung cấp, Sợi, Vải và Dịch vụ từ MISA ASP sang VinhPhatERP. Kích hoạt khi người dùng cung cấp file hóa đơn XML hoặc file Excel/CSV từ MISA.
---

# MISA ASP Synchronization & E-Invoice Automation Skill

## 1. Tổng quan & Mục đích

Skill này cung cấp quy trình tự động hóa chuẩn hóa 100% giữa phần mềm Kế toán **MISA ASP / MISA SME** và hệ thống điều hành sản xuất **VinhPhatERP**:

- Bóc tách Hóa đơn điện tử XML (chuẩn Thông tư 78 / Nghị định 123) từ MISA meInvoice, VNPT, Viettel, v.v.
- Tự động nhận diện Hóa đơn Bán ra (Sales) và Mua vào (Purchase).
- Đồng bộ danh mục Khách hàng (`customers`), Nhà cung cấp (`suppliers`), Danh mục sợi (`yarn_catalogs`), Vải thành phẩm (`fabric_catalogs`) và Dịch vụ gia công / chi phí.
- Chống trùng lặp dữ liệu (Zero Duplicate) và bảo toàn lịch sử công nợ, đơn hàng.

---

## 2. Quy ước Thư mục Tiếp nhận Dữ liệu

| Thư mục             | Mục đích sử dụng                                                                                             | Trạng thái Git            |
| :------------------ | :----------------------------------------------------------------------------------------------------------- | :------------------------ |
| `scratch/uploads/`  | Nơi ném các file hóa đơn XML (`.xml`), file Excel/CSV test nhanh để AI phân tích.                            | 🔒 Private (`.gitignore`) |
| `private/data/`     | Chứa các file danh mục kế toán chính thức (`Danh_sach_khach_hang.xlsx`, `Danh_sach_nha_cung_cap.csv`, v.v.). | 🔒 Private (`.gitignore`) |
| `public/templates/` | Lưu trữ file mẫu Excel/CSV chuẩn để người dùng tải về trên giao diện web.                                    | Public (Git tracked)      |

---

## 3. Quy chuẩn Mã Định danh MISA ASP ⟷ VinhPhatERP

Hệ thống ERP tuân thủ quy chuẩn mã số của MISA ASP:

| Phân hệ                   | Định dạng mã MISA       | Bảng ERP đích                        | Khóa đối soát chính (Deduplication Key) |
| :------------------------ | :---------------------- | :----------------------------------- | :-------------------------------------- |
| **Khách hàng**            | `KH00001` ➔ `KH000xx`   | `customers`                          | Mã số thuế / CCCD (`tax_code`)          |
| **Nhà cung cấp**          | `NCC00001` ➔ `NCC000xx` | `suppliers`                          | Mã số thuế (`tax_code`)                 |
| **Nguyên vật liệu (Sợi)** | `VT00003` ➔ `VT000xx`   | `yarn_catalogs`                      | Mã vật tư MISA (`code`), Tên loại sợi   |
| **Thành phẩm (Vải)**      | `VT00025` ➔ `VT000xx`   | `fabric_catalogs`                    | Mã vật tư MISA (`code`), Quy cách vải   |
| **Dịch vụ gia công**      | `VT00016` ➔ `VT00042`   | `weaving_invoices` / `dyeing_orders` | Bộ ánh xạ `MISA_SERVICE_MAPPINGS`       |
| **Dịch vụ quản trị**      | `VT00001` ➔ `VT00031`   | `expenses`                           | Bộ ánh xạ `MISA_SERVICE_MAPPINGS`       |

---

## 4. Quy trình Tự động hóa 4 Bước (4-Step Pipeline)

```text
[ File XML / CSV / XLSX ]
          │
          ▼
   1. INGEST & PARSE (Bóc tách dữ liệu gốc)
          │
          ▼
   2. AUDIT & DEDUPLICATE (Kiểm tra trùng lặp qua MST / Code)
          │
          ▼
   3. SMART ROUTING (Tự động phân luồng phân hệ ERP)
          │
          ▼
   4. SAFE EXECUTION (Thực thi Idempotent vào Supabase DB)
```

### Bước 1: Bóc tách dữ liệu (Ingest & Parse)

- **Hóa đơn XML:**
  - MST Người bán = `0318633734` (Dệt May Vĩnh Phát) ➔ **Hóa đơn Bán ra (Sales)**.
  - MST Người bán $\ne$ `0318633734` ➔ **Hóa đơn Mua vào (Purchase)**.
  - Trích xuất: Số HĐ, Ký hiệu, Ngày lập, Đối tác (Tên, MST, Địa chỉ), Chi tiết hàng hóa (Mã hàng, Tên hàng, ĐVT, Số lượng, Đơn giá, Thuế suất, Thành tiền).
- **File Bảng kê CSV / Excel:**
  - Dùng `exceljs` để đọc an toàn mọi ô merge cell và định dạng số.

### Bước 2: Kiểm tra trùng lặp (Deduplication)

- **TUYỆT ĐỐI KHÔNG** tạo mới đối tác nếu MST/CCCD đã tồn tại trong ERP.
- Nếu đối tác đã có trong ERP nhưng mang mã cũ (ví dụ `KH-003` hoặc `NCC-006`):
  - Cập nhật mã ERP sang mã chuẩn MISA (`KH00007`, `NCC00004`).
  - Giữ nguyên UUID `id` để bảo toàn lịch sử đơn hàng, phiếu nhập, công nợ.

### Bước 3: Định tuyến thông minh (Smart Routing)

- Dựa vào bảng hằng số `src/shared/constants/misa-mapping.constants.ts`:
  - **Mã Sợi (NVL kho 152):** Định tuyến sang Phiếu nhập kho sợi (`yarn_receipts`) hoặc Danh mục sợi (`yarn_catalogs`).
  - **Mã Gia công Dệt (`VT00017`, `VT00027`, `VT00038`):** Định tuyến sang Hóa đơn dệt gia công (`weaving_invoices`).
  - **Mã Gia công Nhuộm & Hoàn tất (`VT00016`, `VT00019`, `VT00028`, `VT00040`...):** Định tuyến sang Lệnh nhuộm (`dyeing_orders`).
  - **Mã Dịch vụ Phần mềm & Hành chính (`VT00001`, `VT00014`, `VT00021`...):** Định tuyến sang Chi phí quản lý (`expenses`).
  - **Hóa đơn bán vải thành phẩm:** Định tuyến sang Đơn bán hàng (`orders`) và Phiếu xuất kho vải (`finished_fabric_rolls`).

### Bước 4: Thực thi an toàn (Safe Execution)

- Luôn kiểm tra ràng buộc `tenant_id` (`38615337-baf2-49c0-89ba-e3a19691fea6`).
- Mọi thao tác ghi dữ liệu phải đảm bảo tính Idempotent (chạy 1 lần hay nhiều lần đều ra kết quả nhất quán, không sinh rác).

---

## 5. Tài nguyên Hỗ trợ Kèm theo

1. **Bộ ánh xạ dịch vụ:** [`src/shared/constants/misa-mapping.constants.ts`](file:///d:/VinhPhatERP_v3/src/shared/constants/misa-mapping.constants.ts)
2. **Parser Engine:** [`scratch/misa_invoice_engine.cjs`](file:///d:/VinhPhatERP_v3/scratch/misa_invoice_engine.cjs)
3. **Database Guards:** `src/lib/db-guard.ts`
