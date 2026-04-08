---
description: Implement Auto-save and Draft Recovery for Complex Forms
---

# /auto-save-form

## Mục Tiêu (Objective)

Đưa tính năng Auto-save & Draft Recovery vào các Form cực kỳ lớn (như Tạo Đơn Hàng, Tạo Phiếu Nhuộm, Work Order). Đảm bảo nhân sự không bị mất sạch dữ liệu khi đang nhập hàng chục cây vải mà rớt mạng hoặc lỡ F5 trang.

## Các Bước Thực Hiện (Execution Steps)

### 1. Chuẩn bị Custom Hook `useFormAutoSave`

Tạo một hook dùng chung để dễ dàng tái sử dụng cho nhiều form khác nhau. Hook này sẽ tự động capture `watch()` từ `react-hook-form` và lưu xuống `localStorage` hoặc `indexedDB`.

- **Đường dẫn đề xuất:** `src/hooks/useFormAutoSave.ts`
- **Chức năng:**
  - Nhận vào `formId` (định danh duy nhất, ví dụ: `create-order-draft`).
  - Lắng nghe thay đổi form (debounce khoảng 1s - 3s để tránh lag).
  - Khôi phục dữ liệu từ draft khi component mount.
  - Xóa draft khi submit form thành công.

### 2. Tích hợp thư viện lưu trữ

Với các form thông thường, `localStorage` là đủ. Nhưng với form nhập liệu HÀNG TRĂM cây vải, dữ liệu có thể vượt ngưỡng hoặc gây nghẽn đồng bộ.

- Cân nhắc sử dụng `idb-keyval` (IndexedDB) làm engine lưu trữ ẩn thay vì Local Storage nếu dữ liệu mảng cực lớn.
- Bắt lỗi khi Quota Exceeded (hết dung lượng).

### 3. Tích hợp vào Component Form

Trong file Component Form (VD: `CreateOrderForm.tsx`):

- Gọi hook `useFormAutoSave({ formId: 'order-form', methods })`.
- Thêm một UI nhỏ ở góc form (Ví dụ: `Lưu lần cuối lúc 10:30` - Sync Indicator).

### 4. Xử lý Logic Phục Hồi (Recovery Logic)

- Khi bắt đầu mở Form:
  - Nếu có draft data tồn tại trong Storage: Hiển thị Dialog/Alert: "Bạn có dữ liệu đang nhập dở, bạn muốn tiếp tục hay tạo mới?"
  - Nút **Tiếp Tục**: Reset RHF với data từ draft.
  - Nút **Tạo Mới**: Clear draft data và bắt đầu nhập liệu trống như bình thường.

### 5. Xóa Draft Khi Hoàn Tất

- Phải đảm bảo Clear Draft sau khi gọi API `mutateAsync` thành công.
- Tránh trường hợp người dùng tạo đơn xong, quay lại Form tạo mới vẫn thấy data cũ.

## Checklist Kiểm Tra (Verification Checklist)

- [ ] Nhập thông tin form -> reload trang -> liệu có bị mất?
- [ ] Render performance có bị giật/lag khi gõ nhanh (do auto-save trigger liên tục) không? Đã áp dụng `debounce` chưa?
- [ ] Submit Form xong đóng lại -> Mở Form mới lên có bị dính data cũ không? (Clear draft thành công chưa?).
- [ ] Trải nghiệm UX: Thông báo "Có bản nháp đang lưu" hiển thị có rõ hoặc thân thiện trên mobile không?

---

_Ghi chú cho AI: Nếu người dùng chạy lệnh `/auto-save-form` trong file một form cụ thể, hãy áp dụng logic trên cho form đó theo đúng kiến trúc của Vĩnh Phát ERP._
