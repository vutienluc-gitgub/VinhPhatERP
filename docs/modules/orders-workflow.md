# Module Đơn Hàng — Thiết Kế Luồng Nghiệp Vụ Chi Tiết

> Tài liệu này mô tả toàn bộ vòng đời đơn hàng từ tiếp nhận → nhập sợi → dệt gia công → theo dõi tiến độ → xuất hàng → thu tiền.

---

## Mục lục

1. [Tổng quan luồng nghiệp vụ](#1-tổng-quan-luồng-nghiệp-vụ)
2. [Giai đoạn 1: Tiếp nhận đơn hàng](#2-giai-đoạn-1-tiếp-nhận-đơn-hàng)
3. [Giai đoạn 2: Nhập sợi / Chuẩn bị nguyên liệu](#3-giai-đoạn-2-nhập-sợi--chuẩn-bị-nguyên-liệu)
4. [Giai đoạn 3: Dệt gia công](#4-giai-đoạn-3-dệt-gia-công)
5. [Giai đoạn 4: Theo dõi tiến độ sản xuất](#5-giai-đoạn-4-theo-dõi-tiến-độ-sản-xuất)
6. [Giai đoạn 5: Xuất hàng](#6-giai-đoạn-5-xuất-hàng)
7. [Giai đoạn 6: Thu tiền và công nợ](#7-giai-đoạn-6-thu-tiền-và-công-nợ)
8. [Chuyển trạng thái đơn hàng](#8-chuyển-trạng-thái-đơn-hàng)
9. [Màn hình chi tiết](#9-màn-hình-chi-tiết)
10. [Business Rules tổng hợp](#10-business-rules-tổng-hợp)
11. [Kế hoạch triển khai](#11-kế-hoạch-triển-khai)

---

## 1. Tổng quan luồng nghiệp vụ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VÒNG ĐỜI ĐƠN HÀNG                                 │
│                                                                             │
│  ① TIẾP NHẬN       ② NHẬP SỢI        ③ DỆT GIA CÔNG                       │
│  ┌──────────┐      ┌──────────┐      ┌──────────────┐                       │
│  │ Khách gọi│─────►│ Mua sợi  │─────►│ Giao sợi cho │                       │
│  │ đặt hàng │      │ từ NCC   │      │ đối tác dệt  │                       │
│  │          │      │          │      │              │                       │
│  │ Tạo đơn  │      │ Phiếu    │      │ Nhận vải mộc │                       │
│  │ draft    │      │ nhập sợi │      │ về kho       │                       │
│  └────┬─────┘      └────┬─────┘      └──────┬───────┘                       │
│       │                 │                    │                               │
│       ▼                 ▼                    ▼                               │
│  ④ THEO DÕI TIẾN ĐỘ                   ⑤ XUẤT HÀNG        ⑥ THU TIỀN       │
│  ┌──────────────┐                     ┌──────────┐      ┌──────────┐       │
│  │ 7 công đoạn  │────────────────────►│ Tạo phiếu│─────►│ Phiếu thu│       │
│  │ warping →    │                     │ xuất kho  │      │ tiền     │       │
│  │ packing      │                     │          │      │          │       │
│  │              │                     │ Giao từng│      │ Đối chiếu│       │
│  │ Cập nhật     │                     │ phần     │      │ công nợ  │       │
│  │ hàng ngày    │                     │          │      │          │       │
│  └──────────────┘                     └──────────┘      └──────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mối liên kết giữa các module

| Từ module       | Sang module        | Dữ liệu liên kết                         |
| --------------- | ------------------ | ----------------------------------------- |
| Customers       | Orders             | `customer_id` — ai đặt hàng              |
| Orders          | Yarn Receipts      | Gián tiếp — biết cần nhập sợi gì         |
| Yarn Receipts   | Raw Fabric         | `yarn_receipt_id` — sợi nào dệt cuộn nào |
| Raw Fabric      | Finished Fabric    | `raw_roll_id` — mộc nào thành phẩm nào   |
| Orders          | Order Progress     | `order_id` — tiến độ 7 công đoạn          |
| Orders          | Shipments          | `order_id` — xuất hàng theo đơn           |
| Finished Fabric | Shipment Items     | `finished_roll_id` — cuộn nào đã xuất     |
| Orders          | Payments           | `order_id` — thu tiền theo đơn            |

---

## 2. Giai đoạn 1: Tiếp nhận đơn hàng

### 2.1 Luồng tổng quan

```
Khách hàng liên hệ (Zalo / điện thoại / trực tiếp)
       │
       ▼
Nhân viên mở app → Tạo đơn hàng mới
       │
       ├── Chọn khách hàng (từ danh sách hoặc tạo mới nhanh)
       ├── Nhập ngày đặt hàng, ngày giao dự kiến
       ├── Thêm các dòng hàng (loại vải, màu, số lượng, đơn giá)
       ├── Hệ thống tính tổng tiền tự động
       │
       ▼
Đơn hàng trạng thái "Nháp" (draft)
       │
       ▼
Quản lý xem xét → Xác nhận đơn (confirmed)
       │
       ├── Hệ thống tự tạo 7 dòng tiến độ (order_progress)
       ├── Thông báo cho bộ phận kho chuẩn bị nguyên liệu
       │
       ▼
Đơn hàng trạng thái "Đã xác nhận" (confirmed)
```

### 2.2 Màn hình tạo đơn hàng

**Form Header:**

| Trường           | Kiểu       | Bắt buộc | Ghi chú                                      |
| ---------------- | ---------- | -------- | -------------------------------------------- |
| Số đơn hàng      | text       | ✅       | Auto-gen từ prefix `DH` + số tự tăng         |
| Khách hàng       | select     | ✅       | Lookup từ bảng customers, chỉ chọn `active`  |
| Ngày đặt hàng    | date       | ✅       | Default: hôm nay                              |
| Ngày giao dự kiến | date      | ❌       | Phải >= ngày đặt hàng                         |
| Ghi chú          | textarea   | ❌       | Tối đa 500 ký tự                              |

**Form Line Items (repeater):**

| Trường           | Kiểu       | Bắt buộc | Ghi chú                                      |
| ---------------- | ---------- | -------- | -------------------------------------------- |
| Loại vải         | text       | ✅       | Ví dụ: "Cotton 60/40", "PE 100%"             |
| Màu              | text       | ❌       | Tên màu hoặc mã màu                          |
| Số lượng (m)     | number     | ✅       | Phải > 0                                     |
| Đơn giá (đ/m)    | number     | ✅       | Phải >= 0                                    |
| Thành tiền       | computed   | —        | = số lượng × đơn giá (auto)                  |

**Hành động trên form:**

- **Thêm dòng**: Thêm một dòng hàng mới vào cuối
- **Xoá dòng**: Xoá dòng hàng (phải giữ tối thiểu 1 dòng)
- **Lưu nháp**: Lưu đơn ở trạng thái `draft`
- **Xác nhận đơn**: Chuyển sang `confirmed` (cần xác nhận từ người dùng)

### 2.3 Tự động sinh số đơn hàng

```
Quy tắc: {prefix}{năm 2 số}{tháng 2 số}-{số thứ tự 4 chữ số}
Ví dụ:   DH2603-0001, DH2603-0002, ...

Bước 1: Lấy prefix từ bảng settings (key = 'order_number_prefix')
Bước 2: Lấy năm + tháng hiện tại
Bước 3: Đếm số đơn trong tháng + 1
Bước 4: Ghép chuỗi
```

### 2.4 Khi xác nhận đơn hàng (confirm)

Hệ thống thực hiện:

1. **Cập nhật trạng thái** đơn từ `draft` → `confirmed`
2. **Tính tổng tiền** = tổng `amount` của tất cả `order_items`
3. **Cập nhật `total_amount`** trên bảng `orders`
4. **Tự động tạo 7 dòng `order_progress`** với trạng thái `pending`:

```sql
INSERT INTO order_progress (order_id, stage, status, planned_date)
VALUES
  ('{order_id}', 'warping',      'pending', NULL),
  ('{order_id}', 'weaving',      'pending', NULL),
  ('{order_id}', 'greige_check', 'pending', NULL),
  ('{order_id}', 'dyeing',       'pending', NULL),
  ('{order_id}', 'finishing',    'pending', NULL),
  ('{order_id}', 'final_check',  'pending', NULL),
  ('{order_id}', 'packing',      'pending', NULL);
```

5. **Ghi log** thời gian xác nhận và người xác nhận

### 2.5 Business Rules — Tiếp nhận

- Đơn phải có ít nhất 1 dòng hàng
- Khách hàng phải ở trạng thái `active`
- Ngày giao dự kiến phải >= ngày đặt hàng
- Chỉ đơn `draft` mới được sửa tự do
- Chỉ đơn `draft` mới được xác nhận
- Số đơn hàng phải duy nhất (unique)

---

## 3. Giai đoạn 2: Nhập sợi / Chuẩn bị nguyên liệu

### 3.1 Luồng tổng quan

```
Đơn hàng đã xác nhận
       │
       ▼
Kiểm tra tồn kho sợi hiện có
       │
       ├── Đủ sợi → Chuẩn bị cho dệt (bỏ qua bước nhập)
       │
       └── Thiếu sợi → Liên hệ nhà cung cấp
                │
                ▼
          NCC giao sợi về kho
                │
                ▼
          Tạo Phiếu nhập sợi (Yarn Receipt)
                │
                ├── Chọn nhà cung cấp
                ├── Nhập ngày nhập
                ├── Thêm từng dòng sợi (loại, màu, SL, đơn giá)
                ├── Chi tiết lô: số lô, thành phần, xuất xứ, độ bền kéo
                │
                ▼
          Phiếu nhập trạng thái "Nháp" (draft)
                │
                ▼
          Xác nhận phiếu nhập (confirmed)
                │
                ├── Tính tổng tiền phiếu nhập
                ├── Cập nhật tồn kho sợi (qua inventory movement)
                │
                ▼
          Sợi sẵn sàng cho sản xuất
```

### 3.2 Liên kết Đơn hàng ↔ Nhập sợi

Hiện tại hệ thống **không có FK trực tiếp** giữa `orders` và `yarn_receipts`. Đây là thiết kế đúng vì:

- Một lô sợi có thể phục vụ nhiều đơn hàng
- Một đơn hàng có thể dùng sợi từ nhiều lô nhập khác nhau
- Mối liên hệ được truy vết **gián tiếp** qua: `order → raw_fabric_roll.yarn_receipt_id → yarn_receipt`

### 3.3 Giao diện nhập sợi hỗ trợ đơn hàng

Trong màn hình danh sách đơn hàng `confirmed`, hiển thị:

- **Cột "Nguyên liệu"**: icon ✓ (đủ) hoặc ⚠ (cần nhập thêm)
- **Nút "Nhập sợi cho đơn"**: Mở form tạo phiếu nhập với các dòng sợi được gợi ý từ `order_items`

Ví dụ: Đơn hàng yêu cầu 500m vải "Cotton 60/40 màu trắng" → hệ thống gợi ý nhập sợi Cotton cần thiết.

### 3.4 Business Rules — Nhập sợi

- Phiếu nhập phải có ít nhất 1 dòng
- Số lượng phải > 0, đơn giá >= 0
- Nhà cung cấp phải ở trạng thái `active`
- Phiếu đã `confirmed` không được sửa
- Phiếu `confirmed` tạo movement tăng tồn kho sợi

---

## 4. Giai đoạn 3: Dệt gia công

### 4.1 Luồng tổng quan

```
Sợi đã nhập kho
       │
       ▼
Xuất sợi cho đối tác dệt (weaving partner)
       │
       ├── Ghi nhận: loại sợi, số lượng xuất, đối tác dệt
       │
       ▼
Đối tác dệt tiến hành dệt
       │
       ▼
Nhận vải mộc từ đối tác dệt
       │
       ▼
Tạo Cuộn Vải Mộc (Raw Fabric Roll)
       │
       ├── Nhập mã cuộn (auto hoặc thủ công)
       ├── Loại vải, màu, khổ, dài, trọng lượng
       ├── Đánh giá chất lượng A/B/C
       ├── Gán vị trí kho
       ├── Chọn phiếu nhập sợi nguồn (yarn_receipt_id)
       ├── Chọn đối tác dệt (weaving_partner_id)
       │
       ▼
Cuộn vải mộc trạng thái "Trong kho" (in_stock)
       │
       ├── Kiểm phẩm vải mộc → greige_check
       │
       ▼
Chuyển sang xử lý (nhuộm, hoàn tất)
       │
       ▼
Tạo Cuộn Vải Thành Phẩm (Finished Fabric Roll)
       │
       ├── Liên kết cuộn mộc nguồn (raw_roll_id)
       ├── Loại vải, màu, chất lượng sau hoàn tất
       ├── Trạng thái "in_stock" → sẵn sàng cho đơn hàng
       │
       ▼
Vải thành phẩm sẵn sàng xuất kho
```

### 4.2 Quản lý đối tác dệt

Đối tác dệt là **nhà cung cấp** thuộc category đặc biệt. Hệ thống đã hỗ trợ qua:

- Bảng `suppliers` với `category = 'other'` (hoặc cần thêm category `weaving`)
- Migration `0002_add_weaving_partner.sql` đã thêm `weaving_partner_id` vào `raw_fabric_rolls`
- Khi nhập cuộn vải mộc, chọn đối tác dệt từ danh sách nhà cung cấp

### 4.3 Quy trình từ vải mộc → vải thành phẩm

```
Vải mộc (in_stock)
    │
    ├── Kiểm phẩm → Loại A → Chuyển sang nhuộm/hoàn tất
    ├── Kiểm phẩm → Loại B → Xử lý lại hoặc hạ cấp
    ├── Kiểm phẩm → Loại C → Loại bỏ hoặc bán phế
    │
    ▼
Nhuộm / Hoàn tất
    │
    ▼
Tạo cuộn vải thành phẩm
    │
    ├── raw_roll.status → 'in_process' (đang xử lý)
    ├── finished_roll.status → 'in_stock' (sẵn sàng)
    │
    ▼
Kiểm phẩm thành phẩm
    │
    ├── Đạt → Giữ trạng thái 'in_stock'
    └── Không đạt → 'damaged' hoặc xử lý lại
```

### 4.4 Business Rules — Dệt gia công

- Mã cuộn vải mộc phải duy nhất
- Chất lượng chỉ A/B/C
- Cuộn mộc đã chuyển thành phẩm → trạng thái `in_process` hoặc `shipped`
- Mỗi cuộn thành phẩm chỉ liên kết 1 cuộn mộc nguồn (1:1) hoặc không liên kết
- Cuộn thành phẩm `reserved` không được dùng cho đơn khác
- Cuộn thành phẩm `shipped` không được quay lại sửa

---

## 5. Giai đoạn 4: Theo dõi tiến độ sản xuất

### 5.1 Bảy công đoạn sản xuất

| # | Stage          | Tên tiếng Việt     | Mô tả                                    |
|---|----------------|--------------------|--------------------------------------------|
| 1 | `warping`      | Mắc sợi           | Chuẩn bị sợi dọc trên khung dệt           |
| 2 | `weaving`      | Dệt               | Dệt vải trên máy dệt                      |
| 3 | `greige_check` | Kiểm vải mộc       | Kiểm tra chất lượng vải mộc sau dệt       |
| 4 | `dyeing`       | Nhuộm              | Nhuộm màu theo yêu cầu đơn hàng           |
| 5 | `finishing`    | Hoàn tất           | Xử lý bề mặt, co rút, ổn định vải        |
| 6 | `final_check`  | Kiểm thành phẩm    | Kiểm tra chất lượng vải thành phẩm        |
| 7 | `packing`      | Đóng gói           | Đóng gói, dán nhãn, sẵn sàng giao hàng   |

### 5.2 Trạng thái từng công đoạn

| Trạng thái    | Tên tiếng Việt  | Ý nghĩa                              |
| ------------- | --------------- | ------------------------------------- |
| `pending`     | Chờ xử lý      | Công đoạn chưa bắt đầu               |
| `in_progress` | Đang làm        | Công đoạn đang được thực hiện         |
| `done`        | Hoàn thành      | Công đoạn đã xong                     |
| `skipped`     | Bỏ qua          | Công đoạn không áp dụng cho đơn này  |

### 5.3 Luồng cập nhật tiến độ hàng ngày

```
Nhân viên mở app
       │
       ▼
Vào danh sách "Tiến độ đơn hàng"
       │
       ├── Xem board theo công đoạn (warping | weaving | dyeing | ...)
       │   Mỗi cột hiển thị các đơn đang ở công đoạn đó
       │
       ├── HOẶC xem theo đơn hàng
       │   Timeline 7 công đoạn, đánh dấu đã xong
       │
       ▼
Chọn đơn hàng + công đoạn cần cập nhật
       │
       ├── Đổi trạng thái: pending → in_progress → done
       ├── Nhập ngày thực tế (actual_date)
       ├── Ghi chú nếu có vấn đề
       │
       ▼
Hệ thống kiểm tra:
       │
       ├── Nếu TẤT CẢ 7 stage đều `done` hoặc `skipped`
       │   → Tự động đề xuất: "Đơn hàng sẵn sàng giao?"
       │   → Nếu đồng ý: order.status → 'in_progress' (sẵn sàng xuất)
       │
       ├── Nếu actual_date > planned_date
       │   → Đánh dấu ⚠️ TRỄ HẠN
       │
       └── Nếu delivery_date sắp đến mà chưa xong packing
           → Cảnh báo 🔴 SẮP TRỄ GIAO HÀNG
```

### 5.4 Màn hình theo dõi tiến độ

**Dạng 1: Board view (theo stage)**

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  MẮC SỢI  │  │   DỆT    │  │  NHUỘM   │  │ ĐÓNG GÓI │
├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤
│ DH2603-01│  │ DH2603-03│  │ DH2603-02│  │          │
│ KH: Tuấn │  │ KH: Hùng │  │ KH: Mai  │  │  (trống) │
│ ⚠ Trễ 2d │  │ ✓ Đúng hẹn│  │ 🔵 Đang  │  │          │
├──────────┤  ├──────────┤  ├──────────┤  │          │
│ DH2603-05│  │          │  │          │  │          │
│ KH: Lan  │  │          │  │          │  │          │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

**Dạng 2: Timeline view (theo đơn hàng)**

```
DH2603-0001 — KH: Nguyễn Văn Tuấn — Giao: 15/04/2026

  ✅ Mắc sợi     ✅ Dệt      ✅ Kiểm mộc    🔵 Nhuộm    ○ Hoàn tất   ○ Kiểm TP   ○ Đóng gói
  01/04          03/04       05/04         07/04        —            —           —
                                          (đang làm)

  Tiến độ: 43% ████████░░░░░░░░░░░  │  Dự kiến giao: 15/04  │  Trạng thái: Đúng hạn ✓
```

### 5.5 Quy tắc thứ tự công đoạn

- Các công đoạn **phải** tuân thủ thứ tự logic:
  - `warping` → `weaving` → `greige_check` → `dyeing` → `finishing` → `final_check` → `packing`
- **Không được** đánh `in_progress` cho stage N+1 nếu stage N chưa `done` hoặc `skipped`
- **Được phép** `skip` một công đoạn (ví dụ: đơn hàng không cần nhuộm → skip `dyeing`)
- Khi `skip`: ghi lý do vào `notes`

### 5.6 Tính phần trăm tiến độ

```
Tổng stage áp dụng = 7 - số stage skipped
Stage đã done = đếm status = 'done'
Phần trăm = (stage đã done / tổng stage áp dụng) × 100
```

### 5.7 Cảnh báo trễ hạn

| Điều kiện                                                | Mức cảnh báo        | Hành động                        |
| ------------------------------------------------------- | -------------------- | -------------------------------- |
| `actual_date > planned_date` cho bất kỳ stage nào       | ⚠️ Stage trễ         | Hiển thị badge trên timeline     |
| `delivery_date` còn ≤ 3 ngày mà chưa xong `packing`    | 🔴 Sắp trễ giao hàng | Hiển thị trên dashboard          |
| `delivery_date` đã qua mà chưa tạo shipment             | 🔴 Đã trễ giao hàng  | Hiển thị trên danh sách overdue  |

### 5.8 Business Rules — Tiến độ

- Mỗi `(order_id, stage)` chỉ có 1 bản ghi (unique constraint)
- 7 dòng progress được tạo tự động khi đơn hàng `confirmed`
- Không được cập nhật progress của đơn `cancelled`
- `actual_date` chỉ có ý nghĩa khi stage `in_progress` hoặc `done`
- Khi tất cả stage `done`/`skipped` → đơn hàng có thể chuyển `in_progress` → sẵn sàng xuất

---

## 6. Giai đoạn 5: Xuất hàng

### 6.1 Luồng tổng quan

```
Đơn hàng đã hoàn tất sản xuất (tất cả progress done)
       │
       ▼
Nhân viên kho mở "Chi tiết đơn hàng"
       │
       ├── Xem tổng số lượng đặt vs đã xuất vs còn lại
       │
       ▼
Bấm "Tạo phiếu xuất hàng" từ trang chi tiết đơn
       │
       ├── Hệ thống auto-fill: khách hàng, đơn hàng
       ├── Nhập ngày xuất, địa chỉ giao, đơn vị vận chuyển
       │
       ▼
Thêm dòng hàng xuất
       │
       ├── Chọn loại vải + màu (từ order items)
       ├── Nhập số lượng xuất (≤ số lượng còn lại của đơn)
       ├── Chọn cuộn thành phẩm cụ thể (từ finished_fabric_rolls in_stock)
       │
       ▼
Xác nhận phiếu xuất
       │
       ├── Kiểm tra: không vượt order qty, không vượt tồn kho
       ├── Cập nhật finished_roll.status → 'shipped'
       ├── Cập nhật shipped_qty trên các order items
       │
       ▼
Phiếu xuất trạng thái "Đã xuất" (shipped)
       │
       ├── Giao hàng cho khách
       │
       ▼
Xác nhận giao thành công → "Đã giao" (delivered)
```

### 6.2 Hỗ trợ giao hàng từng phần (Partial Shipment)

```
Ví dụ: Đơn DH2603-0001 đặt 1000m vải Cotton trắng

Lần xuất 1 (25/04): 400m → Phiếu XH2604-0001
Lần xuất 2 (02/05): 350m → Phiếu XH2605-0001
Lần xuất 3 (10/05): 250m → Phiếu XH2605-0002

Tổng đã xuất: 1000m = đủ → Đơn hàng completed
```

**Hiển thị trên chi tiết đơn hàng:**

```
┌────────────────────────────────────────────────────────┐
│  Dòng 1: Cotton 60/40 — Trắng                         │
│  Đặt: 1,000m  │  Đã xuất: 750m  │  Còn lại: 250m     │
│  ████████████████████████████░░░░░░░░  75%              │
├────────────────────────────────────────────────────────┤
│  Dòng 2: PE 100% — Xanh navy                          │
│  Đặt: 500m   │  Đã xuất: 500m  │  Còn lại: 0m        │
│  ████████████████████████████████████  100% ✓           │
└────────────────────────────────────────────────────────┘
```

### 6.3 Chọn cuộn thành phẩm để xuất

Khi tạo shipment item, cần picker chọn cuộn:

```
Bộ lọc: Loại vải = "Cotton 60/40" | Màu = "Trắng" | Status = "in_stock"

┌──────────────────────────────────────────────────┐
│  ☐  FIN-2603-0042  │  Cotton 60/40  │  Trắng    │
│      120m  │  A  │  Kho A-R3                     │
├──────────────────────────────────────────────────┤
│  ☐  FIN-2603-0043  │  Cotton 60/40  │  Trắng    │
│      95m   │  A  │  Kho A-R3                     │
├──────────────────────────────────────────────────┤
│  ☐  FIN-2603-0045  │  Cotton 60/40  │  Trắng    │
│      150m  │  B  │  Kho B-R1                     │
└──────────────────────────────────────────────────┘
  Tổng đã chọn: 0m / Cần xuất: 250m
```

### 6.4 Kiểm tra khi xác nhận phiếu xuất

```
Bước 1: Số lượng xuất ≤ số lượng còn lại của order item
        → Nếu vi phạm: "Không thể xuất 300m. Đơn hàng chỉ còn 250m chưa xuất."

Bước 2: Cuộn thành phẩm đã chọn phải ở trạng thái 'in_stock'
        → Nếu vi phạm: "Cuộn FIN-2603-0042 đã được đặt trước cho đơn khác."

Bước 3: Không trùng cuộn giữa nhiều phiếu xuất
        → Nếu vi phạm: "Cuộn FIN-2603-0042 đã nằm trong phiếu xuất XH2605-0001."

Bước 4: Cập nhật DB
        → finished_fabric_rolls.status = 'shipped'
        → shipments.status = 'shipped'
```

### 6.5 Trạng thái phiếu xuất

| Trạng thái             | Ý nghĩa                                  | Cho phép sửa? |
| ---------------------- | ----------------------------------------- | ------------- |
| `preparing`            | Đang chuẩn bị, chưa giao                 | ✅ Được sửa   |
| `shipped`              | Đã xuất kho, đang vận chuyển             | ❌ Khoá       |
| `delivered`            | Khách đã nhận hàng                        | ❌ Khoá       |
| `partially_returned`   | Khách trả lại một phần                    | ❌ Khoá       |
| `returned`             | Khách trả lại toàn bộ                     | ❌ Khoá       |

### 6.6 Business Rules — Xuất hàng

- Shipment phải gắn với đơn hàng đã `confirmed` hoặc `in_progress`
- Không được xuất vượt số lượng còn lại của đơn
- Không được chọn cuộn đã `reserved` cho đơn khác hoặc đã `shipped`
- Shipment `shipped` trở đi không được sửa hoặc xoá
- Khi tổng đã xuất = tổng đặt → hệ thống đề xuất chuyển đơn hàng sang `completed`

---

## 7. Giai đoạn 6: Thu tiền và công nợ

### 7.1 Luồng tổng quan

```
Đơn hàng đã xuất hàng (có shipment)
       │
       ▼
Khách hàng thanh toán (chuyển khoản / tiền mặt / séc)
       │
       ▼
Nhân viên mở "Chi tiết đơn hàng" → Tab "Thanh toán"
       │
       ├── Xem: Tổng tiền, Đã thu, Còn nợ
       │
       ▼
Bấm "Tạo phiếu thu tiền"
       │
       ├── Số phiếu thu (auto-gen: TT2604-0001)
       ├── Ngày thu tiền
       ├── Số tiền (mặc định = số còn nợ)
       ├── Phương thức: tiền mặt / chuyển khoản / séc / khác
       ├── Số tham chiếu (số chứng từ ngân hàng, số séc)
       │
       ▼
Lưu phiếu thu
       │
       ├── Trigger DB tự động cập nhật orders.paid_amount
       ├── Kiểm tra: nếu paid_amount >= total_amount → "Đã thanh toán đủ"
       │
       ▼
Theo dõi công nợ trên dashboard
```

### 7.2 Form phiếu thu tiền

| Trường            | Kiểu       | Bắt buộc | Ghi chú                                     |
| ----------------- | ---------- | -------- | ------------------------------------------- |
| Số phiếu thu      | text       | ✅       | Auto-gen từ prefix `TT`                     |
| Đơn hàng          | select     | ✅       | Auto-fill nếu tạo từ chi tiết đơn           |
| Khách hàng        | computed   | ✅       | Tự lấy từ đơn hàng                          |
| Ngày thu          | date       | ✅       | Default: hôm nay                             |
| Số tiền           | number     | ✅       | > 0, mặc định = balance_due                 |
| Phương thức       | select     | ✅       | cash / bank_transfer / check / other         |
| Số tham chiếu     | text       | ❌       | Mã GD ngân hàng, số séc, v.v.               |
| Ghi chú           | textarea   | ❌       |                                              |

### 7.3 Cơ chế đồng bộ `paid_amount`

Hệ thống dùng **trigger PostgreSQL** (`sync_order_paid_amount`) để:

```sql
-- Khi INSERT/UPDATE/DELETE payment → tính lại paid_amount
UPDATE orders
SET paid_amount = (
  SELECT COALESCE(SUM(amount), 0)
  FROM payments
  WHERE order_id = {order_id}
)
WHERE id = {order_id};
```

→ Frontend chỉ cần `refetch order` sau khi tạo payment, không cần tính toán lại.

### 7.4 Theo dõi công nợ

**Trên chi tiết đơn hàng:**

```
┌────────────────────────────────────────────────────┐
│  THANH TOÁN                                        │
├────────────────────────────────────────────────────┤
│  Tổng tiền đơn:     15,000,000 đ                  │
│  Đã thu:             8,500,000 đ                  │
│  Còn nợ:             6,500,000 đ                  │
│  ████████████████░░░░░░░░░░░░  57%                 │
├────────────────────────────────────────────────────┤
│  Lịch sử thanh toán:                               │
│  ┌──────────────────────────────────────────────┐  │
│  │ TT2604-0001 │ 01/04 │ 5,000,000 │ CK  │ ✓  │  │
│  │ TT2604-0005 │ 15/04 │ 3,500,000 │ TM  │ ✓  │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  [ + Thu tiền ]                                    │
└────────────────────────────────────────────────────┘
```

**Trên dashboard tổng hợp công nợ:**

```
┌────────────────────────────────────────────────────┐
│  CÔNG NỢ KHÁCH HÀNG                               │
├────────────────────────────────────────────────────┤
│  Nguyễn Văn Tuấn        12,500,000 đ  │  3 đơn   │
│  Trần Thị Mai             6,500,000 đ  │  1 đơn   │
│  Lê Hoàng Hùng            3,200,000 đ  │  2 đơn   │
│  ─────────────────────────────────────────────     │
│  Tổng công nợ:          22,200,000 đ              │
└────────────────────────────────────────────────────┘
```

### 7.5 Business Rules — Thu tiền

- Số tiền thu phải > 0
- Số tiền thu **có thể** > balance_due (trường hợp khách trả thừa/ứng trước) — hiển thị cảnh báo
- Payment gắn với đơn hàng hợp lệ (không phải `cancelled`)
- `paid_amount` trên orders được đồng bộ hoàn toàn bởi trigger DB
- Không xoá payment đã tạo — nếu sai, tạo payment điều chỉnh (số tiền âm hoặc phiếu bù trừ)
- Khi `paid_amount >= total_amount` → hiển thị badge "Đã thanh toán đủ"

---

## 8. Chuyển trạng thái đơn hàng

### 8.1 Sơ đồ trạng thái

```
                              ┌────────────┐
                              │  CANCELLED │
                              └──────▲─────┘
                                     │ (huỷ đơn)
                                     │
┌─────────┐    Xác nhận    ┌─────────┴──┐   Đủ progress    ┌─────────────┐   Đủ shipment   ┌───────────┐
│  DRAFT  │───────────────►│ CONFIRMED  │─────────────────►│ IN_PROGRESS │────────────────►│ COMPLETED │
│         │                │            │                  │             │                 │           │
│  Nháp   │                │ Đã xác nhận│                  │ Đang xử lý  │                 │ Hoàn thành│
└─────────┘                └────────────┘                  └─────────────┘                 └───────────┘
     │                           │                               │
     │     (huỷ)                 │     (huỷ)                     │  (huỷ - cần quyền manager)
     └───────────────────────────┴───────────────────────────────┘
                                 │
                                 ▼
                          ┌────────────┐
                          │  CANCELLED │
                          └────────────┘
```

### 8.2 Điều kiện chuyển trạng thái

| Từ            | Sang           | Điều kiện                                           | Ai được làm         |
| ------------- | -------------- | --------------------------------------------------- | ------------------- |
| `draft`       | `confirmed`    | Có ≥ 1 item, khách hàng active                      | staff, manager, admin |
| `confirmed`   | `in_progress`  | Tất cả progress `done`/`skipped` HOẶC thủ công      | staff, manager, admin |
| `in_progress` | `completed`    | Tổng đã xuất = tổng đặt VÀ `paid_amount >= total`   | manager, admin       |
| bất kỳ        | `cancelled`    | Không có shipment `shipped`/`delivered`              | manager, admin       |
| `draft`       | `draft` (sửa)  | Luôn cho phép                                       | staff, manager, admin |
| `confirmed`   | `confirmed` (sửa) | Chỉ sửa ghi chú, ngày giao                       | manager, admin       |

### 8.3 Khi huỷ đơn hàng

1. Kiểm tra: không có phiếu xuất đã `shipped` hoặc `delivered`
2. Kiểm tra: không có phiếu thu tiền (nếu có → cần xử lý hoàn trước)
3. Cập nhật `status = 'cancelled'`
4. Cập nhật tất cả `order_progress.status = 'skipped'`
5. Trả lại cuộn thành phẩm `reserved` → `in_stock` (nếu có reserve flow)

---

## 9. Màn hình chi tiết

### 9.1 Danh sách đơn hàng (OrdersListPage)

**Bộ lọc:**

| Filter            | Kiểu          | Options                                            |
| ----------------- | ------------- | -------------------------------------------------- |
| Tìm kiếm          | text          | Theo số đơn, tên khách                              |
| Trạng thái        | chip/select   | Tất cả / Nháp / Đã xác nhận / Đang xử lý / Hoàn thành / Đã huỷ |
| Khách hàng        | select        | Dropdown khách hàng                                 |
| Ngày đặt          | date range    | Từ ngày — Đến ngày                                  |
| Sắp trễ giao hàng | toggle       | Chỉ hiện đơn delivery_date ≤ today + 3              |

**Card đơn hàng (mobile):**

```
┌────────────────────────────────────────┐
│  DH2603-0001           ● Đã xác nhận  │  ← status chip
│  Nguyễn Văn Tuấn                       │  ← tên khách
│  Ngày đặt: 25/03/2026                 │
│  Giao: 15/04/2026  ⚠ Còn 5 ngày       │  ← cảnh báo
│  ──────────────────────────────────    │
│  3 dòng hàng  │  Tổng: 15,000,000 đ   │
│  Thu: 8,500,000  │  Nợ: 6,500,000     │
│  Tiến độ: ████████░░░░ 57%             │
└────────────────────────────────────────┘
```

### 9.2 Chi tiết đơn hàng (OrderDetailPage)

**Bố cục tab:**

```
┌──────────────────────────────────────────────────────┐
│  ← Quay lại       DH2603-0001        ● Đã xác nhận │
│  Nguyễn Văn Tuấn  │  Giao: 15/04/2026              │
├──────────────────────────────────────────────────────┤
│  [ Thông tin ]  [ Hàng hoá ]  [ Tiến độ ]  [ Thanh toán ] │
├──────────────────────────────────────────────────────┤
│                                                      │
│    (Nội dung tab hiện tại)                           │
│                                                      │
├──────────────────────────────────────────────────────┤
│  [ Sửa đơn ]  [ Tạo phiếu xuất ]  [ Thu tiền ]     │  ← action buttons
└──────────────────────────────────────────────────────┘
```

**Tab Thông tin:** Header đơn hàng + thông tin khách hàng

**Tab Hàng hoá:** Danh sách order items + progress xuất hàng từng dòng

**Tab Tiến độ:** Timeline 7 công đoạn + nút cập nhật

**Tab Thanh toán:** Tổng tiền, đã thu, còn nợ, lịch sử thanh toán + nút thu tiền

### 9.3 Các action chính trên chi tiết đơn hàng

| Action              | Điều kiện                       | Kết quả                          |
| ------------------- | ------------------------------- | -------------------------------- |
| Sửa đơn            | Đơn ở `draft`                   | Mở form chỉnh sửa                |
| Xác nhận đơn       | Đơn ở `draft`                   | Chuyển `confirmed`, tạo progress |
| Cập nhật tiến độ   | Đơn ở `confirmed`/`in_progress` | Mở form cập nhật stage           |
| Tạo phiếu xuất     | Đơn đã `confirmed` trở đi       | Mở form tạo shipment             |
| Thu tiền            | Đơn đã `confirmed` trở đi       | Mở form tạo payment              |
| Huỷ đơn            | Không có shipment đã giao       | Chuyển `cancelled`               |
| Hoàn thành đơn     | Đã giao đủ + đã thu đủ          | Chuyển `completed`               |

---

## 10. Business Rules tổng hợp

### 10.1 Ràng buộc dữ liệu

| Rule                                          | Module           | Kiểm tra tại       |
| --------------------------------------------- | ---------------- | ------------------- |
| Đơn hàng phải có ≥ 1 item                     | Orders           | Frontend + DB       |
| Khách hàng phải `active`                       | Orders           | Frontend            |
| `delivery_date >= order_date`                  | Orders           | Frontend (Zod)      |
| `quantity > 0` cho mọi item                    | Orders, Receipts | Frontend + DB       |
| `unit_price >= 0`                              | Orders, Receipts | Frontend + DB       |
| Mã đơn hàng unique                             | Orders           | DB (unique key)     |
| Mỗi `(order_id, stage)` unique                | Progress         | DB (unique key)     |
| Shipment qty ≤ remaining order qty             | Shipments        | Frontend + Backend  |
| Cuộn thành phẩm chỉ xuất 1 lần                | Shipments        | Frontend + DB       |
| Payment amount > 0                             | Payments         | Frontend + DB       |
| `paid_amount` đồng bộ bởi trigger              | Payments         | DB trigger          |

### 10.2 Quyền hạn

| Hành động                   | viewer | staff | manager | admin |
| --------------------------- | ------ | ----- | ------- | ----- |
| Xem danh sách đơn hàng      | ✅     | ✅    | ✅      | ✅    |
| Tạo đơn hàng mới            | ❌     | ✅    | ✅      | ✅    |
| Sửa đơn hàng (draft)        | ❌     | ✅    | ✅      | ✅    |
| Xác nhận đơn hàng           | ❌     | ✅    | ✅      | ✅    |
| Cập nhật tiến độ            | ❌     | ✅    | ✅      | ✅    |
| Tạo phiếu xuất hàng        | ❌     | ✅    | ✅      | ✅    |
| Tạo phiếu thu tiền          | ❌     | ✅    | ✅      | ✅    |
| Sửa đơn đã xác nhận        | ❌     | ❌    | ✅      | ✅    |
| Huỷ đơn hàng               | ❌     | ❌    | ✅      | ✅    |
| Hoàn thành đơn hàng         | ❌     | ❌    | ✅      | ✅    |
| Xoá phiếu thu tiền          | ❌     | ❌    | ❌      | ✅    |

### 10.3 Tính toán tự động

| Phép tính                          | Trigger                    | Vị trí            |
| ---------------------------------- | -------------------------- | ------------------ |
| `order_item.amount = qty × price`  | Khi insert/update item     | DB (generated col) |
| `order.total_amount = Σ items`     | Khi confirm order          | Backend logic      |
| `order.paid_amount = Σ payments`   | Khi insert/update payment  | DB trigger         |
| `balance_due = total - paid`       | Khi query                  | DB view / Frontend |
| `progress_percent`                 | Khi query                  | Frontend           |

---

## 11. Kế hoạch triển khai

### Phase A — Order CRUD cơ bản

```
Mục tiêu: Tạo, xem, sửa, xoá đơn hàng ở trạng thái draft

Cần làm:
  ✅ OrderListPage — danh sách đơn hàng với filter và search
  ✅ OrderForm — form tạo/sửa đơn với item repeater
  ✅ OrderDetailPage — chi tiết đơn hàng (tabs)
  ✅ useOrders hook — CRUD qua Supabase
  ✅ Auto-generate order number
  ✅ Tính tổng tiền realtime trên form

File cần tạo/sửa:
  - src/features/orders/OrderListPage.tsx
  - src/features/orders/OrderForm.tsx
  - src/features/orders/OrderDetailPage.tsx
  - src/features/orders/useOrders.ts
  - src/features/orders/types.ts
```

### Phase B — Xác nhận đơn và tiến độ

```
Mục tiêu: Xác nhận đơn hàng, tự tạo 7 dòng progress, cập nhật tiến độ

Cần làm:
  ✅ Confirm order flow (draft → confirmed)
  ✅ Auto-create 7 order_progress rows
  ✅ Timeline UI cho 7 công đoạn
  ✅ Cập nhật stage status (pending → in_progress → done)
  ✅ Board view theo stage
  ✅ Cảnh báo trễ hạn

File cần tạo/sửa:
  - src/features/orders/OrderActions.tsx (confirm, cancel)
  - src/features/order-progress/ProgressTimeline.tsx
  - src/features/order-progress/ProgressBoard.tsx
  - src/features/order-progress/useOrderProgress.ts
```

### Phase C — Xuất hàng

```
Mục tiêu: Tạo shipment từ đơn hàng, chọn cuộn thành phẩm, partial shipment

Cần làm:
  ✅ ShipmentForm — tạo từ order detail
  ✅ Roll picker — chọn cuộn thành phẩm in_stock
  ✅ Validate: qty ≤ remaining, roll available
  ✅ Confirm shipment → update roll status
  ✅ Progress bar xuất hàng trên order detail

File cần tạo/sửa:
  - src/features/shipments/ShipmentForm.tsx
  - src/features/shipments/ShipmentListPage.tsx
  - src/features/shipments/RollPicker.tsx
  - src/features/shipments/useShipments.ts
```

### Phase D — Thu tiền và công nợ

```
Mục tiêu: Tạo phiếu thu, đồng bộ công nợ, dashboard nợ

Cần làm:
  ✅ PaymentForm — tạo từ order detail
  ✅ Payment history trên order detail
  ✅ Balance due hiển thị rõ ràng
  ✅ Tổng hợp công nợ theo khách hàng
  ✅ Cảnh báo công nợ quá hạn

File cần tạo/sửa:
  - src/features/payments/PaymentForm.tsx
  - src/features/payments/PaymentListPage.tsx
  - src/features/payments/usePayments.ts
  - src/features/payments/DebtSummary.tsx
```

### Phase E — Tích hợp và dashboard

```
Mục tiêu: Kết nối toàn bộ luồng, dashboard tổng quan

Cần làm:
  ✅ Dashboard: đơn sắp trễ, công nợ lớn, tiến độ chung
  ✅ Order detail tích hợp tất cả tabs
  ✅ Quick actions: từ list → tạo shipment → thu tiền
  ✅ Validation end-to-end từ đơn → xuất → thu tiền
  ✅ Test integration cho các business rules chính
```

---

## Phụ lục: Schema SQL liên quan

### Bảng `orders`

```sql
orders (
  id, order_number, customer_id, order_date, delivery_date,
  total_amount, paid_amount, status, notes, created_by
)
```

### Bảng `order_items`

```sql
order_items (
  id, order_id, fabric_type, color_name, color_code,
  quantity, unit, unit_price, amount (generated), notes, sort_order
)
```

### Bảng `order_progress`

```sql
order_progress (
  id, order_id, stage, status, planned_date, actual_date,
  notes, updated_by, UNIQUE(order_id, stage)
)
```

### Bảng `shipments` + `shipment_items`

```sql
shipments (
  id, shipment_number, order_id, customer_id, shipment_date,
  delivery_address, carrier, tracking_number, status, notes, created_by
)

shipment_items (
  id, shipment_id, finished_roll_id, fabric_type, color_name,
  quantity, unit, notes, sort_order
)
```

### Bảng `payments`

```sql
payments (
  id, payment_number, order_id, customer_id, payment_date,
  amount, payment_method, reference_number, notes, created_by
)
```

### View `v_order_summary`

```sql
SELECT o.id, o.order_number, c.name AS customer_name,
       o.order_date, o.delivery_date, o.status,
       o.total_amount, o.paid_amount,
       (o.total_amount - o.paid_amount) AS balance_due
FROM orders o
JOIN customers c ON c.id = o.customer_id;
```

---

## Phụ lục: Nhãn tiếng Việt cho enum

### Trạng thái đơn hàng (`order_status`)

```typescript
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  in_progress: 'Đang xử lý',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
}
```

### Công đoạn sản xuất (`production_stage`)

```typescript
export const STAGE_LABELS: Record<ProductionStage, string> = {
  warping: 'Mắc sợi',
  weaving: 'Dệt',
  greige_check: 'Kiểm vải mộc',
  dyeing: 'Nhuộm',
  finishing: 'Hoàn tất',
  final_check: 'Kiểm thành phẩm',
  packing: 'Đóng gói',
}
```

### Trạng thái công đoạn (`stage_status`)

```typescript
export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  pending: 'Chờ xử lý',
  in_progress: 'Đang làm',
  done: 'Hoàn thành',
  skipped: 'Bỏ qua',
}
```

### Phương thức thanh toán (`payment_method`)

```typescript
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  check: 'Séc',
  other: 'Khác',
}
```

### Trạng thái phiếu xuất (`shipment_status`)

```typescript
export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  preparing: 'Đang chuẩn bị',
  shipped: 'Đã xuất kho',
  delivered: 'Đã giao hàng',
  partially_returned: 'Trả lại một phần',
  returned: 'Trả lại toàn bộ',
}
```
