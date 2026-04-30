# 🛡️ Audit Report: Concurrency & Race Conditions (ERP Vinh Phát)

**Date**: 2026-04-30
**Scope**: Toàn bộ kiến trúc API, Database và UI State Management của ERP Vinh Phát v3.

Hệ thống hiện tại đang sử dụng mô hình RESTful/RPC hỗn hợp qua Supabase. Qua quá trình phân tích luồng dữ liệu (Data Flow) và các endpoint, tôi đã phát hiện các lỗ hổng nghiêm trọng về đồng thời (Concurrency) và Race Condition theo đúng 4 cảnh báo đã được nêu ra.

---

## 1. Thiếu Optimistic Concurrency Control (OCC)

**Tình trạng hiện tại:** TẤT CẢ các hàm cập nhật dữ liệu (`updateOrder`, `updateCustomer`, `safeUpsert`, v.v.) hiện đang thực thi cơ chế **"Last Write Wins" (LWW)** một cách mù quáng.

- Mã nguồn TS hiện tại chỉ gọi: `.update(payload).eq('id', id)`.
- **Không có bất kỳ trường `updated_at` hay `version` nào được kiểm tra** ở mệnh đề `WHERE`.
- **Rủi ro (Lost Update):**
  - User A tải đơn hàng X lúc 8:00 AM.
  - User B tải đơn hàng X lúc 8:01 AM.
  - User A thêm "Ghi chú A" và bấm Save lúc 8:05 AM.
  - User B đổi "Ngày giao hàng" và bấm Save lúc 8:06 AM.
  - **Hậu quả:** Ghi chú A của User A sẽ bị User B ghi đè (xóa mất) hoàn toàn vì User B gửi toàn bộ payload cũ lên cùng với ngày giao hàng mới.

## 2. Rủi ro Double Submit (Spam Click)

**Tình trạng hiện tại:**

- Đã khắc phục thành công ở khâu Tạo mới (Create) nhờ cơ chế UUID Client-side Idempotency.
- **Rủi ro ở khâu Cập nhật (Update / Action):** Các thao tác chuyển đổi trạng thái (như `updateOrderStatus`, `markDyeingOrderPaid`) chưa được bảo vệ chặn đúp ở tầng Database. Mặc dù UI có `disabled={isPending}`, nhưng nếu user dùng công cụ bypass hoặc mạng bị lag gửi 2 requests đi cùng lúc, API vẫn sẽ xử lý 2 lần (Parallel API calls ghi đè nhau).

## 3. Parallel API Calls Ghi Đè Nhau (Sai Công Nợ / Lệch Tồn Kho)

Đây là lỗ hổng **NGHIÊM TRỌNG NHẤT** ảnh hưởng đến dữ liệu Tài chính và Kho bãi.
**Tình trạng hiện tại:**
Các hàm cập nhật giá trị tích lũy (ví dụ: `paid_amount`) đang được tính toán theo mô hình: **Đọc ở Client -> Cộng dồn -> Ghi xuống DB bằng `.update()`**.

- **Ví dụ điển hình:** `markDyeingOrderPaid(id, paidAmount)` hoặc `markWeavingInvoicePaid(id, paidAmount)`.
- **Race Condition:**
  - Kế toán A thu 1.000.000đ -> UI tính: `new_paid = 0 + 1tr = 1tr`.
  - Kế toán B thu 500.000đ cùng lúc -> UI tính: `new_paid = 0 + 500k = 500k`.
  - Hai API `.update({ paid_amount })` chạy song song. Lệnh chạy sau cùng sẽ ghi đè lệnh trước.
  - **Hậu quả:** Sai lệch công nợ tuyệt đối. Tiền thu được ghi nhận sai.

_(Giải pháp bắt buộc: Công nợ phải được cập nhật bằng RPC Transaction `UPDATE ... SET paid_amount = paid_amount + p_amount` thay vì truyền giá trị tĩnh từ UI)._

## 4. Background Job / Queue Không Khóa (No Lock)

**Tình trạng hiện tại:**

- Dự án đã bắt đầu áp dụng `SELECT ... FOR UPDATE` cho việc cấp phát Sợi (Yarn Reservation) và Cuộn Vải (Finished Roll Reservation) qua các file SQL migration gần đây. Đây là một dấu hiệu tốt.
- **Nhưng:** Các hàng chờ ngoại tuyến (Offline Queue) hoặc Edge Functions xử lý đồng bộ vẫn chưa áp dụng triệt để Row-level Lock. Nếu hệ thống Offline Queue đẩy hàng loạt các Mutation lên cùng một entity, chúng sẽ bị Race Condition do không được phân bổ vào các Queue xử lý tuần tự (Sequential queue) hoặc không có `pg_advisory_xact_lock`.

---

## 🚀 Kế hoạch khắc phục đề xuất (Action Plan)

1. **Vá ngay "Sai Công Nợ & Tồn Kho" (Critical):**
   - Rà soát toàn bộ các hàm cập nhật có tính chất cộng dồn (`paid_amount`, `total_amount`, `inventory_qty`).
   - Chuyển đổi 100% các thao tác này sang **PostgreSQL RPC** để tận dụng phép toán Atomic: `UPDATE table SET col = col + param WHERE id = ...`. Tuyệt đối cấm tính toán ở tầng TypeScript rồi `.update()`.

2. **Áp dụng OCC toàn cục (Optimistic Concurrency Control):**
   - Bổ sung `expected_updated_at` vào các hàm update cốt lõi (`updateOrder`, `updateCustomer`, `updateSupplier`).
   - Cập nhật hàm API: `.update(row).eq('id', id).eq('updated_at', expected_updated_at)`.
   - Bắt lỗi `Row Not Found` ở UI và báo cho user: _"Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang."_

3. **Củng cố State Transition (Trạng thái đơn hàng):**
   - Mọi hàm đổi trạng thái (ví dụ `updateOrderStatus`) phải kèm điều kiện trạng thái cũ: `.eq('status', current_status)`. Nếu sai trạng thái cũ thì từ chối cập nhật để chặn Parallel API calls bẻ gãy Flow.
