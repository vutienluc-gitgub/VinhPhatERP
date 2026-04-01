# Tính năng: Gửi Chứng Từ Sau Xuất Kho Qua Zalo

## Mục tiêu nghiệp vụ

Sau khi phiếu xuất kho được xác nhận, hệ thống tự động sinh phiếu giao hàng PDF và gửi cho khách hàng qua Zalo.

## Mốc kích hoạt

- **Chỉ gửi sau khi shipment đã được xác nhận (confirmed).**
- Không gửi từ bản nháp. Không gửi từ module reports.
- Điểm gắn vào UI: màn hình chi tiết shipment.

---

## Luồng nghiệp vụ

```
Người dùng mở chi tiết shipment
    │
    ▼
Kiểm tra shipment đang ở trạng thái draft/pending
    │
    ▼
Bấm "Xác nhận xuất kho và gửi chứng từ"
    │
    ▼
Frontend gửi yêu cầu lên Edge Function (shipment_id, send_to_customer)
    │
    ▼
[Edge Function]
    ├─ Đọc shipment + items + order + customer
    ├─ Kiểm tra điều kiện (xem bên dưới)
    ├─ Confirm shipment + trừ tồn (1 transaction DB)
    ├─ Sinh PDF phiếu giao hàng
    ├─ Upload PDF → Supabase Storage
    ├─ Tạo signed URL có thời hạn
    ├─ Gọi Zalo API: gửi tin nhắn + link PDF
    └─ Ghi log outbound → bảng document_delivery_logs
    │
    ▼
Frontend nhận kết quả và hiển thị trạng thái
```

---

## Điều kiện trước khi thực hiện

Edge Function kiểm tra trước khi đổi bất kỳ trạng thái nào:

- Shipment chưa ở trạng thái `confirmed`.
- Customer tồn tại và có thông tin liên hệ Zalo hợp lệ (`is_zalo_enabled = true`).
- Shipment items đủ dữ liệu để tạo chứng từ.

---

## Nguyên tắc quan trọng: tách xác nhận kho và gửi Zalo

**Confirm shipment** là nghiệp vụ lõi, phải được thực hiện trong một DB transaction riêng, không được rollback khi Zalo lỗi.

**Gửi Zalo** là tác vụ hậu kỳ. Nếu lỗi:

- Shipment vẫn giữ trạng thái `confirmed`.
- Log đánh dấu `delivery_status = failed`.
- Người dùng có thể gửi lại từ màn hình chi tiết shipment.

| Tình huống         | Trạng thái shipment | Trạng thái gửi |
| ------------------ | ------------------- | -------------- |
| Confirm lỗi        | Không đổi           | Không thay đổi |
| Confirm thành công | `confirmed`         | `pending`      |
| PDF sinh lỗi       | `confirmed`         | `failed`       |
| Zalo API lỗi       | `confirmed`         | `failed`       |
| Gửi thành công     | `confirmed`         | `sent`         |

---

## Trạng thái gửi chứng từ (`document_status`)

| Giá trị         | Ý nghĩa                |
| --------------- | ---------------------- |
| `not_generated` | Chưa sinh chứng từ     |
| `generated`     | PDF đã sinh, chưa gửi  |
| `sent`          | Đã gửi Zalo thành công |
| `failed`        | Gửi lỗi, chờ gửi lại   |

---

## Dữ liệu cần bổ sung

### Bảng `customers` — thêm các cột

| Cột                   | Kiểu      | Mô tả                                    |
| --------------------- | --------- | ---------------------------------------- |
| `zalo_phone`          | `text`    | Số điện thoại chuẩn hóa dùng cho Zalo    |
| `zalo_recipient_name` | `text`    | Tên người nhận chứng từ qua Zalo         |
| `is_zalo_enabled`     | `boolean` | Cho phép gửi chứng từ qua Zalo hay không |

### Bảng `shipments` — thêm các cột

| Cột               | Kiểu          | Mô tả                           |
| ----------------- | ------------- | ------------------------------- |
| `confirmed_at`    | `timestamptz` | Thời điểm xác nhận xuất kho     |
| `confirmed_by`    | `uuid`        | Profile id người xác nhận       |
| `document_status` | `text` (enum) | Trạng thái sinh và gửi chứng từ |
| `document_url`    | `text`        | Đường dẫn Storage đến file PDF  |
| `last_sent_at`    | `timestamptz` | Lần gửi Zalo gần nhất           |
| `last_send_error` | `text`        | Mô tả lỗi nếu gửi thất bại      |

### Bảng mới `document_delivery_logs`

| Cột                   | Kiểu          | Mô tả                                     |
| --------------------- | ------------- | ----------------------------------------- |
| `id`                  | `uuid`        | PK                                        |
| `shipment_id`         | `uuid`        | FK → shipments                            |
| `customer_id`         | `uuid`        | FK → customers                            |
| `channel`             | `text`        | `zalo`                                    |
| `document_type`       | `text`        | `delivery_note`                           |
| `storage_path`        | `text`        | Đường dẫn file PDF trong Storage          |
| `external_message_id` | `text`        | Message id từ Zalo API nếu gửi thành công |
| `status`              | `text`        | `sent`, `failed`, `pending`               |
| `error_message`       | `text`        | Nội dung lỗi nếu thất bại                 |
| `retry_count`         | `integer`     | Số lần đã thử gửi lại                     |
| `created_at`          | `timestamptz` | Thời điểm tạo log                         |
| `sent_at`             | `timestamptz` | Thời điểm gửi thành công                  |

---

## Nội dung PDF phiếu giao hàng

| Phần           | Nội dung                                       |
| -------------- | ---------------------------------------------- |
| Header         | Tên công ty, logo, số phiếu xuất, ngày giao    |
| Khách hàng     | Tên, địa chỉ giao, người nhận                  |
| Đơn hàng       | Số đơn hàng tham chiếu                         |
| Danh sách hàng | Danh sách cuộn / dòng hàng, loại vải, số lượng |
| Giao hàng      | Carrier, tracking nếu có                       |
| Ghi chú        | Ghi chú giao hàng tự do                        |

Thư viện gợi ý: **pdf-lib** hoặc **pdfmake** chạy trong Edge Function.

---

## UI cần có ở màn hình chi tiết shipment

1. **Nút "Xác nhận xuất kho"** — chỉ hiện khi trạng thái là `draft` hoặc `pending`.
2. **Checkbox / toggle "Gửi chứng từ cho khách"** — mặc định bật nếu khách có `is_zalo_enabled`.
3. **Badge trạng thái gửi** — hiện rõ `Chưa gửi`, `Đã gửi`, hoặc `Gửi lỗi`.
4. **Nút "Gửi lại chứng từ"** — chỉ hiện khi `document_status = failed`.
5. **Nút "Xem PDF"** — hiện khi `document_url` đã có.

---

## Xử lý lỗi và retry

| Nhóm lỗi                        | Hành động                                             |
| ------------------------------- | ----------------------------------------------------- |
| Lỗi trước confirm               | Chặn, không đổi trạng thái, trả lỗi rõ cho UI         |
| Lỗi sau confirm, trước gửi Zalo | Shipment vẫn `confirmed`, đánh dấu `failed`, retry    |
| Zalo API lỗi                    | Log lỗi, tăng `retry_count`, cho phép resend thủ công |

Retry không được tự đảo ngược trạng thái shipment.

---

## Backend: Supabase Edge Function

**Tên gợi ý:** `confirm-shipment-and-send-doc`

**Đầu vào:**

```json
{
  "shipment_id": "uuid",
  "send_to_customer": true
}
```

**Đầu ra:**

```json
{
  "confirmed": true,
  "document_generated": true,
  "delivery_status": "sent" | "failed" | "skipped",
  "document_url": "...",
  "error": null | "Mô tả lỗi"
}
```

**Bảo mật:**

- Chỉ role `admin` hoặc `manager` mới được gọi.
- Zalo API secret không được lộ ra frontend, chỉ tồn tại trong Edge Function environment variables.
- Signed URL Storage nên đặt TTL phù hợp (ví dụ: 7 ngày).

---

## Giao tiếp Zalo

- Ưu tiên gửi **link tải PDF** qua Zalo OA message, không gửi file nhị phân trực tiếp.
- Nội dung mẫu tin nhắn:

```
[Tên công ty]
Phiếu giao hàng số: [shipment_number]
Ngày giao: [shipment_date]
Tải chứng từ: [signed_url]
(Link hiệu lực trong 7 ngày)
```

---

## Phụ thuộc

- Shipments
- Customers
- Supabase Storage
- Supabase Edge Function
- Zalo OA API

## File liên quan

- `src/features/shipments/ShipmentsPage.tsx`
- `src/features/shipments/shipments.module.ts`
- `src/features/customers/customers.module.ts`
- `supabase/migrations/` — migration bổ sung cột và bảng mới
- `supabase/functions/confirm-shipment-and-send-doc/` — Edge Function (chưa tạo)
