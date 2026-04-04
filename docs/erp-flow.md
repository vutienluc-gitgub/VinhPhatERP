# ERP Flow - Textile Business

Tài liệu này mô tả toàn bộ các quy trình (Business Flows) cốt lõi đang được vận hành hệ thống ERP Dệt May Vĩnh Phát. Hệ thống đáp ứng toàn trình chuỗi cung ứng từ quản lý nguyên liệu, sản xuất, bán hàng đến quản lý dòng tiền.

## 1. Luồng Bán hàng và Giao hàng (Sales & Fulfillment Flow)

Luồng xử lý quy trình bán ra sản phẩm:

1. **Báo giá (Quotations)**
   - Chọn khách hàng, thiết lập báo giá với đầy đủ các phí VAT, chiết khấu, giá cước.
   - In và gửi báo giá cho khách duyệt.
   - **Chuyển đổi:** Báo giá sau khi duyệt được chuyển thành Đơn hàng (Order).

2. **Kiểm tra Công nợ Khách hàng trước khi tạo đơn (Credit Limit Check)** ← _MỚI_

   Đây là bước bắt buộc phải thực hiện **trước khi** cho phép tạo đơn hàng mới.

   - _Các trường dữ liệu liên quan trên Customer:_
     - `credit_limit`: Hạn mức công nợ tối đa cho phép (VD: 50,000,000 VND)
     - `current_debt`: Tổng công nợ hiện tại đang còn nợ
     - `overdue_debt`: Phần công nợ đã quá hạn thanh toán
     - `credit_status`: Trạng thái tín dụng (`active` / `on_hold` / `blocked`)

   - _Quy tắc kiểm tra (theo thứ tự ưu tiên):_
     1. Nếu `credit_status = blocked` → **Từ chối tạo đơn**, yêu cầu liên hệ kế toán
     2. Nếu `overdue_debt > 0` → **Cảnh báo** nợ quá hạn, yêu cầu Manager xác nhận mới được tiếp tục
     3. Nếu `(current_debt + giá trị đơn mới) > credit_limit` → **Cảnh báo** vượt hạn mức, yêu cầu Manager xác nhận
     4. Nếu tất cả điều kiện trên đều thoả → **Cho phép** tiếp tục tạo đơn

   - _Ai có quyền override:_
     - `Sale`: Không có quyền, phải báo lên cấp trên
     - `Manager`: Có thể xác nhận tiếp tục khi có cảnh báo (trường hợp 2 và 3)
     - `Admin`: Có thể bỏ qua mọi cảnh báo và thay đổi `credit_status`

   - _Sau khi tạo đơn thành công:_ Giá trị đơn hàng được **cộng tạm thời** vào `current_debt` (pending). Chỉ hạch toán chính thức khi xuất kho.

3. **Đơn hàng (Orders)**
   - _Các bước tạo đơn:_
     1. Chọn khách hàng
     2. **Kiểm tra credit limit** (xem mục 2 ở trên)
     3. Chọn lô hàng/mã vải (Select fabric lot)
     4. Nhập số lượng mét cần đặt (Input quantity)
     5. Hệ thống kiểm tra số lượng tồn kho (Check stock)
     6. **Hệ thống tự động phân bổ lô theo FIFO** (xem mục 4 ở dưới)
     7. Tạo đơn hàng và đồng thời **giữ chỗ (reserve) số lượng tồn** (Reserve inventory)
   - **Quy tắc:** Không thể tạo và duyệt đơn hàng nếu không đủ hàng tồn kho khả dụng.

   - _Vòng đời trạng thái đơn hàng (Order Status Flow):_
     ```
     DRAFT → CONFIRMED → PICKING → SHIPPED → INVOICED → CLOSED
                ↓                               ↓
           CANCELLED                        RETURNED (một phần hoặc toàn bộ)
     ```
     - `DRAFT`: Đơn đang soạn thảo, chưa khoá tồn kho
     - `CONFIRMED`: Đơn đã duyệt, tồn kho bị **reserve** (không cho đơn khác dùng)
     - `PICKING`: Kho đang chuẩn bị hàng
     - `SHIPPED`: Đã xuất kho, tồn kho bị **deduct** thực tế, công nợ hạch toán chính thức
     - `INVOICED`: Đã xuất hoá đơn VAT
     - `CLOSED`: Hoàn tất, không còn thao tác nào
     - `CANCELLED`: Huỷ đơn → phải **giải phóng reserved inventory** ngay lập tức
     - `RETURNED`: Trả hàng → **hoàn lại tồn kho** và **giảm công nợ** tương ứng

4. **Phân bổ Lô hàng theo FIFO (Lot Allocation — First In, First Out)** ← _MỚI_

   Khi một đơn hàng cần X mét vải loại Y, hệ thống **không để nhân viên tự chọn lô** mà phải phân bổ tự động theo nguyên tắc FIFO.

   - _Nguyên tắc FIFO:_ Lô nào nhập kho trước (`received_date` nhỏ hơn) thì được xuất trước. Tránh tồn đọng hàng cũ, giảm rủi ro hư hỏng và lỗi màu do lô cũ.

   - _Thuật toán phân bổ:_
     ```
     1. Lọc tất cả lô vải khớp với: fabric_code, color, width, gsm
     2. Chỉ lấy lô có: available_quantity > 0 (không tính reserved)
     3. Sắp xếp theo: received_date ASC (cũ nhất lên đầu)
     4. Lần lượt lấy từng lô cho đến khi đủ số mét yêu cầu:
        - Nếu lô hiện tại đủ → lấy hết số mét cần, dừng
        - Nếu lô hiện tại không đủ → lấy toàn bộ lô đó, chuyển sang lô tiếp theo
     5. Ghi lại kết quả phân bổ vào bảng order_lot_items:
        (order_id, lot_id, allocated_meters, reserved_at)
     ```

   - _Ví dụ thực tế:_
     - Đơn cần 500m vải Cotton Trắng 160cm 180gsm
     - Lô A (nhập 01/01): còn 200m khả dụng → lấy 200m
     - Lô B (nhập 15/01): còn 400m khả dụng → lấy 300m (đủ 500m, dừng)
     - Lô C (nhập 20/01): không động đến

   - _Trường hợp không đủ tồn:_
     - Tổng available < số mét yêu cầu → **Từ chối tạo đơn**, trả về thông báo:
       `"Chỉ có {X}m khả dụng, đơn yêu cầu {Y}m"`
     - Không được phép tạo đơn thiếu hàng, ngay cả khi Manager yêu cầu

   - _Dữ liệu bắt buộc trên bảng `fabric_lots` để FIFO hoạt động:_
     - `received_date` (DATE, NOT NULL) — ngày nhập kho thực tế
     - `available_quantity` (DECIMAL) — số mét còn lại, chưa bị reserve
     - `reserved_quantity` (DECIMAL) — số mét đang bị giữ chỗ bởi các đơn CONFIRMED

5. **Tiến độ Đơn hàng (Order Progress)**
   - Theo dõi mốc thời gian (timeline) và trạng thái sản xuất/chuẩn bị của mỗi dòng hàng trong đơn hàng để đảm bảo ngày giao hàng cam kết.

6. **Xuất kho (Shipments)**
   - Trích xuất từ các đơn hàng thành phiếu xuất kho vật lý.
   - Xuất hàng khỏi xe, giao tới khách và ghi nhận trạng thái.
   - **Quy tắc:** Luôn cập nhật và khấu trừ thực tế (Deduct inventory) dựa hoàn toàn trên việc xuất kho và kết thúc vòng đời đơn hàng.
   - Khi xuất kho thành công: `available_quantity` và `reserved_quantity` đều giảm, công nợ khách hàng hạch toán chính thức.

## 2. Luồng Cung ứng & Sản xuất Sản phẩm (Supply Chain & Production Flow)

Hỗ trợ truy xuất luồng nguyên vật liệu thô đến khi thành thành phẩm:

1. **Nhập Sợi (Yarn Receipts & Catalog)**
   - Quản lý danh mục sợi.
   - Ghi nhận việc nhập mua nguyên liệu sợi vào kho.

2. **Vải Mộc (Raw Fabric)**
   - Làm việc với xưởng/nhà dệt: Sử dụng sợi để dệt ra vải mộc.
   - Ghi nhận hao hụt nguyên liệu theo định mức (xem mục Yield Loss bên dưới).
   - Quản lý các lô vải mộc vừa dệt xong chờ nhuộm.

3. **Vải Thành phẩm (Finished Fabric)**
   - Làm việc với xưởng/nhà nhuộm: Nhuộm mộc thành thành phẩm.
   - Ghi nhận hao hụt trong quá trình nhuộm (xem mục Yield Loss bên dưới).
   - **Bắt buộc QC trước khi nhập kho** (xem mục QC Flow bên dưới).
   - Chỉ tạo phiếu nhập kho và lô thành phẩm sau khi QC PASSED.

4. **Hao hụt Sản xuất (Yield Loss)** ← _MỚI_

   Mỗi công đoạn sản xuất đều có hao hụt nguyên liệu. Hệ thống phải ghi nhận và so sánh với định mức cho phép để phát hiện bất thường.

   - _Hai loại hao hụt cần theo dõi:_

     | Công đoạn | Đầu vào | Đầu ra | Hao hụt thường gặp |
     |---|---|---|---|
     | Dệt (Weaving) | Sợi (kg) | Vải mộc (mét) | Sợi đứt, sợi thừa đầu cuộn |
     | Nhuộm (Dyeing) | Vải mộc (mét) | Vải thành phẩm (mét) | Co rút, lỗi màu, biên vải |

   - _Công thức tính Yield Loss:_
     ```
     yield_loss_pct = (input_qty - output_qty) / input_qty * 100

     Ví dụ dệt:
       Input:  1,000 kg sợi
       Output: 920m vải mộc (quy đổi theo định mức: 1kg sợi → 1m vải)
       → Yield loss = (1,000 - 920) / 1,000 * 100 = 8%

     Ví dụ nhuộm:
       Input:  500m vải mộc
       Output: 482m vải thành phẩm
       → Yield loss = (500 - 482) / 500 * 100 = 3.6%
     ```

   - _Dữ liệu bắt buộc trên Work Order để tính Yield Loss:_
     - `input_material_id` — lô sợi hoặc lô vải mộc được đưa vào
     - `input_quantity` — số lượng đầu vào thực tế (kg hoặc mét)
     - `expected_output_quantity` — sản lượng kỳ vọng theo định mức
     - `actual_output_quantity` — sản lượng thực tế thu được (điền sau khi xong)
     - `yield_loss_pct` — tự động tính khi `actual_output_quantity` được nhập
     - `standard_loss_pct` — định mức hao hụt cho phép (cấu hình theo từng loại vải)

   - _Quy tắc cảnh báo Yield Loss:_
     ```
     Nếu yield_loss_pct > standard_loss_pct + 2%
     → Cảnh báo bất thường, gắn cờ work order để Manager xem xét
     → Không chặn sản xuất nhưng bắt buộc ghi chú nguyên nhân

     Nếu yield_loss_pct > standard_loss_pct + 5%
     → Cảnh báo nghiêm trọng, yêu cầu Manager xác nhận trước khi tiếp tục
     ```

   - _Trường hợp quy đổi đơn vị (sợi kg → vải mét):_
     - Mỗi loại sợi có `conversion_rate` (VD: 1kg Cotton 30s → 0.95m vải 160cm 180gsm)
     - `expected_output_quantity = input_quantity * conversion_rate * (1 - standard_loss_pct/100)`
     - `conversion_rate` được cấu hình trong danh mục nguyên liệu, không hardcode

5. **Kiểm tra Chất lượng (QC Flow)** ← _MỚI_

   Không có lô vải thành phẩm nào được nhập kho bán hàng mà không qua bước QC. Đây là cổng (gate) bắt buộc giữa sản xuất và tồn kho.

   - _Vòng đời trạng thái QC:_
     ```
     PENDING_QC → IN_INSPECTION → PASSED → nhập kho thành phẩm → sẵn sàng bán
                                → FAILED → REWORK (làm lại) hoặc REJECTED (loại bỏ)
                                               ↓
                                          PENDING_QC (quay lại kiểm tra sau rework)
     ```

   - _Các tiêu chí kiểm tra (Inspection Checklist):_

     | Tiêu chí | Mô tả | Đơn vị đo |
     |---|---|---|
     | Màu sắc (Color) | So sánh với mẫu chuẩn | Pass/Fail + ghi chú lệch màu |
     | Khổ vải (Width) | Đo thực tế so với spec | cm, sai số ±1cm |
     | Định lượng (GSM) | Cân mẫu cắt 10x10cm | g/m², sai số ±5gsm |
     | Lỗi bề mặt (Defects) | Đếm lỗi trên 100m | lỗi/100m, tối đa 3 lỗi |
     | Độ bền màu (Fastness) | Thử giặt/ma sát | Thang 1-5, tối thiểu 3.5 |

   - _Kết quả QC và hành động tương ứng:_

     **PASSED — Toàn bộ tiêu chí đạt:**
     - Tạo lô thành phẩm (`fabric_lots`) với `qc_status = passed`
     - Ghi nhận `actual_output_quantity` vào work order
     - Tính yield loss và cảnh báo nếu vượt định mức
     - Nhập vào tồn kho, sẵn sàng cho Sales Flow

     **FAILED — Một hoặc nhiều tiêu chí không đạt:**
     - Gắn cờ lô hàng là `qc_status = failed`
     - Ghi rõ tiêu chí nào fail và giá trị đo được
     - Manager quyết định: `REWORK` (gửi lại xưởng nhuộm) hoặc `REJECTED`
     - Nếu `REWORK`: tạo work order mới, lô hàng quay lại `PENDING_QC`
     - Nếu `REJECTED`: ghi nhận toàn bộ số mét bị loại vào `waste_quantity`, tính vào yield loss

   - _Dữ liệu bắt buộc trên bảng `qc_inspections`:_
     - `lot_id` — lô vải đang kiểm tra
     - `work_order_id` — liên kết với lệnh sản xuất
     - `inspector_id` — nhân viên QC thực hiện
     - `inspected_at` — thời điểm kiểm tra
     - `status` — `pending` / `passed` / `failed`
     - `checklist` — JSON lưu kết quả từng tiêu chí: `{color: pass, width: 159cm, gsm: 182, defects: 2, fastness: 4.0}`
     - `fail_reasons` — mảng các lý do fail (nếu có)
     - `action_taken` — `none` / `rework` / `rejected`
     - `rework_count` — số lần đã rework (cảnh báo nếu > 2 lần)

   - _Quy tắc bổ sung:_
     - Một lô hàng chỉ được rework tối đa **2 lần**. Nếu fail lần 3 → tự động `REJECTED`, không cho rework thêm
     - `rejected` hàng không được nhập tồn kho bán hàng trong bất kỳ trường hợp nào
     - Toàn bộ lịch sử QC phải được lưu lại để truy xuất nguồn gốc (traceability)

## 3. Luồng Quản lý Tồn kho (Inventory Flow)

Quản lý tất cả tài sản, nguyên vật liệu của công ty:
- Theo dõi chặt chẽ tồn kho theo từng **Lô hàng (Track by lot)**.
- Các trường thuộc tính quản lý cốt lõi của một lô vải:
  - `code` (Mã)
  - `color` (Màu sắc)
  - `width` (Khổ vải)
  - `gsm` (Định lượng vải)
  - `quantity` (Số lượng hiện có)
  - `received_date` (Ngày nhập kho — bắt buộc cho FIFO)
  - `available_quantity` (Số mét khả dụng = quantity - reserved_quantity)
  - `reserved_quantity` (Số mét đang bị giữ chỗ bởi đơn CONFIRMED)
- Hệ thống hỗ trợ phân chia khái niệm tồn kho thực tế và tồn kho bị giữ chỗ (reserved). Truy tìm cảnh báo tồn thấp.

## 4. Luồng Tài chính Kế toán (Financial Flow)

Quản lý toàn bộ dòng tiền và công nợ trong vận hành — đây là luồng liên kết trực tiếp với Sales Flow và Partner Management.

### 4.1 Vòng đời Công nợ Khách hàng (Customer Debt Lifecycle)

Công nợ của khách hàng thay đổi qua từng sự kiện trong vòng đời đơn hàng. Hệ thống phải cập nhật `current_debt` chính xác tại mỗi bước — không được batch update cuối ngày.

```
Sự kiện                  →  Tác động lên current_debt
─────────────────────────────────────────────────────────
Order CONFIRMED          →  + order_value (ghi nhận tạm, trạng thái: pending)
Order CANCELLED          →  - order_value (hoàn lại, xoá bút toán pending)
Order SHIPPED            →  pending → chính thức (không đổi số, đổi trạng thái)
Invoice phát hành        →  Gắn due_date theo payment_terms
Payment thu được         →  - payment_amount (giảm current_debt)
Order RETURNED (một phần)→  - giá trị hàng trả (giảm current_debt tương ứng)
Quá due_date chưa trả   →  Chuyển sang overdue_debt, cập nhật credit_status
```

- _Phân biệt hai loại công nợ:_
  - `current_debt`: Tổng nợ đang còn (gồm cả pending và chính thức, chưa quá hạn)
  - `overdue_debt`: Phần nợ đã qua `due_date` mà chưa thanh toán — con số này ảnh hưởng trực tiếp đến Credit Limit Check ở Sales Flow

- _Công thức tính số dư công nợ tại bất kỳ thời điểm nào:_
  ```
  current_debt = SUM(invoiced_orders) + SUM(pending_orders) - SUM(payments_received) - SUM(returns)
  overdue_debt = SUM(invoices WHERE due_date < TODAY AND status != 'paid')
  ```

- _Quy tắc tự động cập nhật `credit_status`:_
  ```
  Nếu overdue_debt > 0 và overdue > 30 ngày  → credit_status = 'on_hold'
  Nếu overdue_debt > 0 và overdue > 60 ngày  → credit_status = 'blocked'
  Nếu overdue_debt = 0 và current_debt < credit_limit → credit_status = 'active'
  ```
  - Job tự động chạy mỗi ngày lúc 00:00 để cập nhật `credit_status`
  - Chỉ `Admin` mới được thay đổi `credit_status` thủ công (override)

---

### 4.2 Điều khoản Thanh toán (Payment Terms)

Mỗi khách hàng được gán một `payment_term` cố định, quyết định khi nào nợ đến hạn. Hệ thống dùng `payment_term` để tự động tính `due_date` khi phát hành invoice.

- _Các loại Payment Term được hỗ trợ:_

  | Mã | Tên | Ý nghĩa | Ví dụ |
  |---|---|---|---|
  | `COD` | Cash on Delivery | Thanh toán khi nhận hàng | due_date = shipped_date |
  | `PREPAY` | Prepayment | Đặt cọc 100% trước khi xuất kho | Phải thu đủ trước khi PICKING |
  | `NET7` | Net 7 days | Thanh toán trong vòng 7 ngày | due_date = invoice_date + 7 ngày |
  | `NET15` | Net 15 days | Thanh toán trong vòng 15 ngày | due_date = invoice_date + 15 ngày |
  | `NET30` | Net 30 days | Thanh toán trong vòng 30 ngày | due_date = invoice_date + 30 ngày |
  | `50_50` | 50% đặt cọc | 50% trước khi xuất, 50% sau 15 ngày | 2 dòng payment schedule |

- _Công thức tính `due_date`:_
  ```
  due_date = invoice_date + payment_term.days

  Trường hợp đặc biệt:
  - COD:     due_date = shipment.shipped_date
  - PREPAY:  due_date = order.confirmed_date (phải trả trước)
  - 50_50:   tạo 2 bản ghi payment_schedules:
               line 1: amount = order_value * 50%, due_date = confirmed_date
               line 2: amount = order_value * 50%, due_date = invoice_date + 15 ngày
  ```

- _Quy tắc chặn xuất kho theo Payment Term:_
  ```
  Nếu payment_term = PREPAY:
    → Kiểm tra payments_received >= order_value trước khi cho phép PICKING
    → Nếu chưa đủ tiền cọc → chặn chuyển sang trạng thái PICKING

  Nếu payment_term = 50_50:
    → Kiểm tra payment line 1 (50%) đã thu chưa trước khi cho phép PICKING
    → Nếu chưa → chặn

  Nếu payment_term = COD / NET*:
    → Không chặn xuất kho, nhưng phải có invoice trước khi SHIPPED
  ```

---

### 4.3 Thu tiền và Phiếu thu (Payment Collection)

- _Luồng xử lý khi khách thanh toán:_
  1. Kế toán tạo **Phiếu thu** (`receipts`): chọn khách hàng, nhập số tiền, ngày thu, hình thức (tiền mặt / chuyển khoản)
  2. Chọn invoice(s) cần đối chiếu (một phiếu thu có thể thanh toán nhiều invoice)
  3. Hệ thống tự động:
     - Giảm `current_debt` của khách đúng số tiền thu
     - Cập nhật trạng thái invoice sang `partially_paid` hoặc `paid`
     - Nếu `overdue_debt` giảm về 0 → xem xét tự động cập nhật `credit_status = active`
  4. Ghi log: `PAYMENT_RECEIVED` với đầy đủ: receipt_id, customer_id, amount, invoice_ids

- _Xử lý thanh toán thừa (overpayment):_
  - Số tiền dư được ghi vào `customer.credit_balance` (tiền thừa của khách)
  - Lần mua tiếp theo có thể dùng `credit_balance` để trừ vào invoice

- _Xử lý thanh toán thiếu (partial payment):_
  - Invoice chuyển sang `partially_paid`, ghi rõ `paid_amount` và `remaining_amount`
  - `overdue_debt` chỉ tính phần `remaining_amount` nếu đã qua `due_date`

---

### 4.4 Chi tiền và Phiếu chi (Payment to Suppliers)

- _Các loại chi phí cần theo dõi:_

  | Loại | Đối tượng | Liên kết với |
  |---|---|---|
  | Mua sợi | Nhà cung cấp sợi | Purchase Order |
  | Gia công dệt | Xưởng dệt | Work Order (Weaving) |
  | Gia công nhuộm | Xưởng nhuộm | Work Order (Dyeing) |
  | Vận chuyển | Đối tác logistics | Shipment |
  | Chi phí khác | Nhiều đối tượng | Expense category |

- _Luồng phiếu chi:_
  1. Tạo phiếu chi → chọn nhà cung cấp → gắn với PO hoặc Work Order tương ứng
  2. Manager duyệt phiếu chi (bắt buộc với chi phí > ngưỡng cấu hình, mặc định 5,000,000 VND)
  3. Kế toán thực hiện thanh toán → ghi nhận ngày chi thực tế
  4. Cập nhật `supplier.payable_balance` (công nợ phải trả nhà cung cấp)

---

### 4.5 Báo cáo Công nợ (Debt Reports)

Các báo cáo tài chính bắt buộc — AI phải generate được từ dữ liệu trên:

- **Bảng tuổi nợ khách hàng (Aging Report):**
  ```
  Phân nhóm current_debt theo khoảng thời gian quá hạn:
  - Chưa đến hạn
  - Quá hạn 1–30 ngày
  - Quá hạn 31–60 ngày
  - Quá hạn 61–90 ngày
  - Quá hạn > 90 ngày (rủi ro cao)
  ```

- **Sao kê công nợ theo khách (Customer Statement):**
  - Liệt kê toàn bộ: đơn hàng, invoice, phiếu thu, trả hàng theo thứ tự thời gian
  - Số dư mở đầu → từng giao dịch → số dư hiện tại

- **Dự báo dòng tiền (Cash Flow Forecast):**
  - Tổng tiền dự kiến thu trong 7 / 15 / 30 ngày tới (dựa trên due_date của các invoice chưa trả)
  - Tổng tiền dự kiến chi trong cùng kỳ (dựa trên payment schedule với nhà cung cấp)

## 5. Luồng Quản lý Đối tác (Partner Management Flow)

Lưu trữ thông tin liên lạc cho nhiều mắc xích trong chuỗi cung ứng:
- **Khách hàng (Customers):** Thông tin người mua.
  - Các trường tài chính bắt buộc: `credit_limit`, `current_debt`, `overdue_debt`, `credit_status`
- **Nhà cung cấp (Suppliers):** Các đối tác nhà bán sợi, xưởng dệt mộc, xưởng nhuộm gia công và logistics/vận tải.

## 6. Luồng Quản trị & Ra quyết định (Admin & Reports Flow)

- **Báo cáo (Reports):** Dữ liệu phân tích đa chiều như KPI, cảnh báo trễ đơn, sức khoẻ nhà kho (doanh số, tỷ lệ rủi ro hàng hoá).
- **Cấu hình & Cước phí (Settings & Shipping Rates):** Đặt luật cước phí giao nhận, hệ thống phân quyền nhân viên (Admin, Manager, Sale, v.v.).
